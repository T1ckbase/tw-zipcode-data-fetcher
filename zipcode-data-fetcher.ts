import { DOMParser, type HTMLDocument } from '@b-fuze/deno-dom';

export type Captcha = {
  key: string;
  code: string;
};

export type ZipCodeData = [
  zipCode: string,
  county: string,
  district: string,
  road: string,
  section: string,
  range: string,
  landmark: string,
];

export class ZipCodeDataFetcher {
  private dom: HTMLDocument | null = null;

  constructor(private captcha: Captcha, private url: string = 'https://www.post.gov.tw/post/internet/Postal/index.jsp?ID=208') {}

  async fetchAllData(): Promise<ZipCodeData[]> {
    const countys = await this.getCountys();
    const allData: ZipCodeData[] = [['郵遞區號', '縣市', '區域', '路名', '段號', '投遞範圍', '大宗段名稱']];

    for (let i = 0; i < countys.length; i++) {
      const county = countys[i];
      console.log(`[${i + 1}/${countys.length}] Fetching ${county}...`);

      const data = await this.getZips(county);
      console.log(`[${i + 1}/${countys.length}] Fetched ${data.length} data for ${county}`);

      allData.push(...data);
    }

    return allData;
  }

  private async fetchHTML(): Promise<void> {
    if (this.dom) return;

    const response = await fetch(this.url);
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    const text = await response.text();
    this.dom = new DOMParser().parseFromString(text, 'text/html');
    if (!this.dom) {
      throw new Error('Failed to parse HTML');
    }
  }

  async getLastUpdated(): Promise<string> {
    await this.fetchHTML();
    const div = this.dom?.querySelector('div#ShareNav');
    const lastUpdated = div?.textContent?.match(/最後更新日期：(\d+\/\d+\/\d+)/)?.[1];
    if (!lastUpdated) {
      throw new Error('Failed to find lastUpdated');
    }
    return lastUpdated;
  }

  async getCountys(): Promise<string[]> {
    await this.fetchHTML();
    const select = this.dom?.querySelector('select#city2_zip6');
    if (!select) {
      throw new Error('Failed to find select');
    }
    const options = Array.from(select.querySelectorAll('option'));
    // 第一個是「請選擇」，跳過
    options.shift();
    return options.map((option) => option.textContent);
  }

  async getZips(county: string): Promise<ZipCodeData[]> {
    const formData = {
      list: '5',
      list_type: '2',
      firstView: '4',
      firstView2: '1',
      vKey: `${this.captcha.key}\r\n`,
      city2_zip6: county,
      cityarea2_zip6: '%',
      road_zip6: '',
      sec_zip6: '%',
      checkImange2_zip6: this.captcha.code,
      Submit: '查詢',
    };
    const formDataString = Object.entries(formData).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');
    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formDataString,
    });
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    const text = await response.text();
    if (text.includes('驗證碼輸入錯誤')) {
      throw new Error('驗證碼錯誤');
    }
    const dom = new DOMParser().parseFromString(text, 'text/html');
    const table = dom.querySelector('table.TableStyle_02');
    if (!table) {
      throw new Error('Failed to find table');
    }
    const rows = Array.from(table.querySelectorAll('tr'));
    rows.shift();
    const data: ZipCodeData[] = [];
    for (const row of rows) {
      const cells = row.querySelectorAll('td');
      const zipCode = cells[0].textContent?.trim();
      if (!zipCode) {
        continue;
      }
      data.push([
        zipCode,
        county,
        cells[1].textContent?.trim(),
        cells[2].textContent?.trim(),
        cells[3].textContent?.trim(),
        cells[4].textContent?.trim(),
        cells[5].textContent?.trim(),
      ]);
    }
    return data;
  }
}
