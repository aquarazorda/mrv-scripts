import { readFile, readFileSync, readdirSync, unlinkSync } from "fs";
import names from "../names.json";
// ffmpeg -loop 1 -i ima.jpg -ss 00:01:45 -i snd.mp3 -t 00:01:00 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest out.mp4

try {
  const old = readdirSync("./out");
  old.forEach((file) => {
    const filePath = `./out/${file}`;
    unlinkSync(filePath);
    console.log(`Removed ${filePath}`);
  });
} catch {}

const files = readdirSync("./files");

type Name = keyof typeof names;

const render = (name: string, imageFormat: string) =>
  Bun.spawnSync(
    [
      "ffmpeg",
      "-loop",
      "1",
      "-i",
      `./files/${name}.${imageFormat}`,
      "-ss",
      `${names[name as Name]}`,
      "-i",
      `./files/${name}.mp3`,
      "-t",
      "00:01:00",
      "-vf",
      "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2",
      "-c:v",
      "libx264",
      "-tune",
      "stillimage",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-pix_fmt",
      "yuv420p",
      "-shortest",
      `./out/${name}.mp4`,
    ],
    {
      cwd: "./",
    },
  );

console.log(files);
Object.keys(names).forEach((name) => {
  const file = files.find((file) => {
    return file.includes(name);
  });

  if (!file) return;

  console.log(`Processing ${name}`);

  const res = render(name, "jpeg");

  if (!res.success) {
    console.log(name, res.stderr);
    const res2 = render(name, "jpg");
    if (!res2.success) {
      console.log(name, res2.stderr);
    }
  }
});
