import { match } from "ts-pattern";
import data from "../wp_posts.json";
import fs from "fs";

const dbData = data[2];

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

function jsonToCSV(jsonData: (typeof dbData)["data"]): string {
  if (!jsonData || jsonData?.length === 0) {
    return "";
  }

  const headers = Object.keys(
    jsonData[0],
  ) as unknown as (keyof (typeof jsonData)[number])[];

  const csvRows = jsonData.map((item) =>
    headers
      .map((header) => {
        const val = match(header)
          .with("description", () => stripHtml(item[header]))
          .with("price", () => {
            const price = Number(item[header]);
            return Math.ceil(price * 1.115);
          })
          .otherwise(() => item[header]);

        return JSON.stringify(val, null, 0);
      })
      .join(","),
  );

  return [headers.join(","), ...csvRows].join("\r\n");
}

const writeData = jsonToCSV(dbData.data);
fs.writeFileSync("./out/stock-" + new Date().toISOString() + ".csv", writeData);
console.log(
  "Successfully written to file " + dbData?.data?.length + " records.",
);

// SELECT wp_posts.id,
//     wp_posts.post_title AS title,
//     wp_posts.post_excerpt AS description,
//     CASE
//         WHEN wp_posts_duplicate.post_parent > 0 THEN wp_posts_duplicate.guid
//         ELSE wp_posts_duplicate_img.guid
//     END AS image_url,
//     wp_wc_product_meta_lookup.stock_quantity AS quantity,
//     wp_wc_product_meta_lookup.max_price AS price,
//     GROUP_CONCAT(wp_terms.name SEPARATOR ', ') AS categories
// FROM wp_posts
// LEFT JOIN wp_wc_product_meta_lookup ON wp_posts.id = wp_wc_product_meta_lookup.product_id
// LEFT JOIN wp_posts AS wp_posts_duplicate ON wp_posts_duplicate.post_parent = wp_posts.id
// LEFT JOIN wp_posts AS wp_posts_duplicate_img ON wp_posts_duplicate_img.id = wp_posts.id - 1
// LEFT JOIN wp_term_relationships ON wp_posts.id = wp_term_relationships.object_id
// LEFT JOIN wp_term_taxonomy ON wp_term_relationships.term_taxonomy_id = wp_term_taxonomy.term_taxonomy_id
// LEFT JOIN wp_terms ON wp_term_taxonomy.term_id = wp_terms.term_id
// WHERE wp_wc_product_meta_lookup.stock_quantity > 0
//     AND wp_terms.name NOT IN ('simple', 'Optional')
//     AND wp_posts.post_date >= '2023-12-21' -- Add your desired date here
// GROUP BY wp_posts.id,
//     title,
//     description,
//     image_url,
//     quantity,
//     price;
