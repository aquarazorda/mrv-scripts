import requests
import json
import re
from yattag import Doc, indent
from bs4 import BeautifulSoup

print("Enter discogs id:")
url = input()
ds_id = re.findall("release/(.*?)-", url)[0]
data = requests.get(f"https://api.discogs.com/releases/{ds_id}").json()

doc, tag, text = Doc().tagtext()

artist = data["artists"][0]["name"]
title = data["title"]

r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
soup = BeautifulSoup(r.text, "html.parser")
scripts = soup.findAll("meta", {"property": "og:image"})
image = re.findall(r'content="(.*?)"', str(scripts))
if len(image):
    image = image[0]

label = data["labels"][0]["name"]
cat = data["labels"][0]["catno"]
year = data["year"]

f = open("release.html", "w", encoding="utf-8")

f.write("Genre - ")
if "genres" in data:
    for genre in data["genres"]:
        f.write(f"{genre}, ")

f.write("\nStyles - ")
if "styles" in data:
    for style in data["styles"]:
        f.write(f"{style}, ")

f.write(
    f"""
Title / {artist} - {title}\n
Image - {image}\n
\n-----------------------\n
ლეიბლი - {label} / {cat}
წელი - {year}\n
"""
)

# f.write(f"""
# Title / {artist} - {title}\n
# \n-----------------------\n
# ლეიბლი - {label} / {cat}
# წელი - {year}\n
# """)

with tag("table", ("class", "playlist")):
    with tag("tbody"):
        for track in data["tracklist"]:
            with tag("tr", ("class", f"tracklist_track track")):
                with tag("td", ("class", "tracklist_track_pos")):
                    text(track["position"])
                with tag("td", ("class", "track tracklist_track_title")):
                    found = False
                    if "videos" in data.keys():
                        for video in data["videos"]:
                            if video["title"].find(track["title"]) >= 0:
                                with tag(
                                    "a", ("href", video["uri"]), ("target", "_blank")
                                ):
                                    text(track["title"])
                                found = True
                                break
                    if found == False:
                        with tag("span"):
                            text(track["title"])
                if track["duration"]:
                    with tag(
                        "td", ("class", "tracklist_track_duration"), ("width", "25")
                    ):
                        text(track["duration"])


f.write(indent(doc.getvalue()))
f.write(
    f'\nმდგომარეობა: <strong><span style="color: #339966;">კარგი (VG+)</span></strong>'
)

f.close()
print("Aba gaxseni release.html dzma")
