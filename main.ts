import { type Captcha, ZipCodeDataFetcher } from './zipcode-data-fetcher.ts';
import { stringify } from '@std/csv/stringify';

// https://www.post.gov.tw/post/internet/Postal/index.jsp?ID=208
const captcha: Captcha = {
  key: '89e43309-9807-46e2-94ca-67587381f6ae',
  code: '1525',
};
const fetcher = new ZipCodeDataFetcher(captcha);
const data = await fetcher.fetchAllData();

const csv = stringify(data);
console.log(`Data length: ${data.length}`);
Deno.writeTextFileSync('zipcode.csv', csv);
