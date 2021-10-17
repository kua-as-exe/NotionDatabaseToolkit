import { Client } from "@notionhq/client";
import * as dotenv from "dotenv";
import moment from "moment";
dotenv.config();

import { NotionPage } from "./types";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const UpdateWeek = (page: NotionPage, weekNumber: number): NotionPage => {
  const setWeek = (date: string, weekNumber: number) =>
    moment(date).set("week", weekNumber).toISOString();

  let dateProp = page.properties["date"];
  if (dateProp.type == "date") {
    if (dateProp.date.start)
      dateProp.date.start = setWeek(dateProp.date.start, weekNumber);

    if (dateProp.date.end)
      dateProp.date.end = setWeek(dateProp.date.end, weekNumber);
  }
  page.properties["date"] = dateProp;

  return page;
};

async function main() {

  const scheduleDB_ID = String(process.env.SCHEDULE_DB_ID);
  if( !scheduleDB_ID ) return console.error("DB ID not found")


  const res = await notion.databases.query({ database_id: scheduleDB_ID });
  const DB: NotionPage[] = res.results;
  console.log(`👍 Loaded ${DB.length} pages`)

  const weekNumber = Number(process.argv[2])
  console.log(`🗓 Updating week pages to week #${weekNumber}`)

  for await (let page of DB) {
    // console.log(` 🟡 Updating: ${page.id}`);

    page = UpdateWeek( page, weekNumber );

    let { properties, icon, cover, archived } = Object.assign({}, page)
    //@ts-expect-error
    await notion.pages.update({ page_id: page.id, properties, icon, cover, archived });
  }

  console.log(`✅ ${DB.length} pages updated`);
}

main();
