import os, sys, json, re, argparse, io, requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import anthropic
try:
    from json_repair import repair_json
except ImportError:
    repair_json = lambda x: x

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_IMAGE_MODEL = os.getenv("GEMINI_IMAGE_MODEL", "imagen-3.0-generate-001")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
CLAUDE_MODEL_NAME = os.getenv("CLAUDE_MODEL_NAME", "claude-sonnet-4-6")
WP_BASE_URL = os.getenv("WP_BASE_URL", "").rstrip("/")
WP_USERNAME = os.getenv("WP_USERNAME")
WP_APP_PASSWORD = os.getenv("WP_APP_PASSWORD")

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client_claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY, timeout=600.0) if ANTHROPIC_API_KEY else None

def slugify(t):
    return re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')

def scrape_url(url):
    print(f"[*] Scraping Content: {url}")
    r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=15)
    soup = BeautifulSoup(r.content, 'html.parser')
    title = soup.title.string if soup.title else (soup.h1.text if soup.h1 else "Mese")
    text = "\n\n".join([p.get_text() for p in soup.find_all('p')])
    return title.strip(), text.strip()

def check_duplicate(slug):
    r = requests.get(f"{WP_BASE_URL}/wp-json/wp/v2/mese?slug={slug}")
    if r.status_code == 200 and r.json():
        print(f"[!] Duplicate Alert: '{slug}' already exists."); sys.exit(0)

def build_image_prompt(scene, title):
    """STANDALONE IMAGE PROMPT GENERATOR — 3:4 RATIO ENFORCED"""
    return (
        "A classic European folk-tale children's book illustration. "
        f"SCENE: {scene if scene else title} "
        "STYLE & MOOD: 2D flat vector art mixed with subtle watercolor textures. "
        "Minimalist and atmospheric. Vintage storybook aesthetic. "
        "Muted, rich color palette suitable for dark mode and bedtime reading. "
        "Strong use of shadows, silhouettes, and soft moody lighting.\n"
        "RATIO: 3:4\n"
        "RESTRICTIONS: NO 3D, NO CGI, NO Pixar, NO Disney style, NO frame, "
        "no glossy plastic textures, no hyperrealism, no decorative frame. "
        "ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO TITLES anywhere on the image."
    )

def generate_story(raw):
    print(f"[*] AI Narrative Synthesis ({CLAUDE_MODEL_NAME})...")

    prompt_path = os.path.join(os.path.dirname(__file__), "prompt.txt")
    with open(prompt_path, "r", encoding="utf-8") as f:
        instruction = f.read()

    try:
        message = client_claude.messages.create(
            model=CLAUDE_MODEL_NAME,
            max_tokens=8000,
            system=instruction,
            messages=[{"role": "user", "content": f"Transform this text into the requested JSON story format. Keep EVERY word of the original narrative.\n\n{raw}"}]
        )

        result_text = next((b.text for b in message.content if b.type == "text"), "")
        if not result_text:
            raise ValueError("No text returned from Claude.")

        json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
        result_text = json_match.group(0) if json_match else result_text.replace('```json', '').replace('```', '').strip()
        result_text = result_text.replace('\r\n', '\n').replace('\r', '\n')

        try:
            data = json.loads(result_text)
        except json.JSONDecodeError:
            data = json.loads(repair_json(result_text))

    except Exception as e:
        print(f"[!] Synthesis Error: {e}"); raise e

    data["image_prompt"] = build_image_prompt(data.get("scene_description"), data.get("title"))
    return data

def generate_hero_image(prompt):
    print("[*] Generating Visual Asset (Explicit 3:4 Ratio)...")
    try:
        from google import genai as google_genai
        from google.genai import types
        client = google_genai.Client(api_key=GEMINI_API_KEY)
        model_name = GEMINI_IMAGE_MODEL if GEMINI_IMAGE_MODEL.startswith("models/") else f"models/{GEMINI_IMAGE_MODEL}"
        res = client.models.generate_images(
            model=model_name,
            prompt=prompt,
            config=types.GenerateImagesConfig(
                aspect_ratio="3:4",
                number_of_images=1
            )
        )
        return res.generated_images[0]
    except Exception as e:
        print(f"[!] Image Error: {e}"); return None

def upload_media(img, slug):
    if not img: return None
    print("[*] Uploading Asset to WordPress...")
    try:
        b = img.image.image_bytes if hasattr(img, 'image') and hasattr(img.image, 'image_bytes') else None
        if not b:
            o = io.BytesIO(); img.image.save(o, format='PNG'); b = o.getvalue()
        r = requests.post(f"{WP_BASE_URL}/wp-json/wp/v2/media", data=b, auth=(WP_USERNAME, WP_APP_PASSWORD),
                         headers={'Content-Disposition': f'attachment; filename={slug}.png', 'Content-Type': 'image/png'})
        return r.json()['id']
    except: return None

def get_term(tax, val):
    try:
        r = requests.get(f"{WP_BASE_URL}/wp-json/wp/v2/{tax}?search={val}")
        return r.json()[0]['id'] if r.json() else None
    except: return None

def get_tags(tags):
    ids = []; auth = (WP_USERNAME, WP_APP_PASSWORD)
    for t in tags:
        try:
            r = requests.get(f"{WP_BASE_URL}/wp-json/wp/v2/story_tag?search={t}", auth=auth)
            if r.json(): ids.append(r.json()[0]['id'])
            else:
                r = requests.post(f"{WP_BASE_URL}/wp-json/wp/v2/story_tag", json={"name": t}, auth=auth)
                ids.append(r.json()['id'])
        except: pass
    return ids

def upload_to_wp(data, mid=None, update_id=None):
    print("[*] CMS Layer Synchronization...")
    content = f"<div class='mese-body'>{data.get('content')}</div>"
    if data.get("image_prompt"):
        content += f"\n<div id='mese-hidden-image-prompt' style='display: none;'>{data['image_prompt']}</div>"

    payload = {
        "title": data.get("title"), "content": content, "status": "draft",
        "acf": {
            "hero_image": data.get("hero_image"), "reading_time": data.get("reading_time"),
            "question_1": data.get("question_1"), "question_2": data.get("question_2"), "question_3": data.get("question_3"),
            "seo_alt_text": data.get("seo_alt_text"), "seo_title": data.get("seo_title"), "seo_description": data.get("seo_description")
        }
    }
    if mid: payload["featured_media"] = mid
    age = get_term("age_group", data.get("age_group"))
    mood = get_term("mood", data.get("mood"))
    tags = get_tags(data.get("tags", []))
    if age: payload["age_group"] = [age]
    if mood: payload["mood"] = [mood]
    if tags: payload["story_tag"] = tags

    url = f"{WP_BASE_URL}/wp-json/wp/v2/mese"
    if update_id:
        url = f"{url}/{update_id}"
        print(f"[*] Updating existing story ID: {update_id}")

    r = requests.post(url, json=payload, auth=(WP_USERNAME, WP_APP_PASSWORD))
    r.raise_for_status()
    print(f"[+] Story live: {WP_BASE_URL}/wp-admin/post.php?post={r.json()['id']}&action=edit")

def main():
    p = argparse.ArgumentParser()
    p.add_argument("url")
    p.add_argument("--id", type=int, help="Update existing story by ID")
    a = p.parse_args()

    title, raw = scrape_url(a.url)
    slug = slugify(title)

    if not a.id:
        check_duplicate(slug)

    data = generate_story(raw)
    mid = upload_media(generate_hero_image(data["image_prompt"]), slug)
    upload_to_wp(data, mid, update_id=a.id)

if __name__ == "__main__": main()