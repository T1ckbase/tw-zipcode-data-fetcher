import { type Captcha, ZipCodeDataFetcher } from './zipcode-data-fetcher.ts';
import { stringify } from '@std/csv/stringify';

// https://www.post.gov.tw/post/internet/Postal/index.jsp?ID=208
const captcha: Captcha = {
  key: '90345b0e-5dd5-4df2-ab9d-97b02a04f87b',
  code: '3443',
};
const fetcher = new ZipCodeDataFetcher(captcha);
const data = await fetcher.fetchAllData();

const csv = stringify(data);
console.log(`Data length: ${data.length}`);
Deno.writeTextFileSync('zipcode.csv', csv);
