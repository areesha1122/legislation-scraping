import xlsx from 'xlsx';
import axios from 'axios';
import PDFJS from 'pdfjs-dist';
import { Sequelize } from 'sequelize';
import { readFileSync } from 'fs';

import { sequelize } from '../../database/index.js';
import { STATES } from '../../constants/states.enum.js';
import { date_regex } from '../../utils/regex.js';

const HEADER_HEIGHT = 120;
const FOOTER_HEIGHT = 88;
const STATE = STATES.QLD;

const addQLDActsLinks = async () => {
  console.log('STATE: QLD');
  console.log('Adding acts links from excel sheet to database');
  await readExcelFile();
  console.log('Completed - adding acts links from excel sheet to database');
};

const readExcelFile = async () => {
  try {
    const workbook = xlsx.read(
      readFileSync('./src/data/excel-files/QueenslandLegislation.xlsx'),
      {
        type: 'buffer',
      }
    );
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);

      // console.log(`Sheet Name: ${sheetName}`);
      console.log(data.length);
      data.forEach(async (row) => {
        // Do something with each row of excel sheet

        // todo.. bulk create with with no duplicate values
        await upsertTheAct(row);
      });
    });
  } catch (err) {
    console.log('ERR READING XLSX FILE:', err);
  }
};

const upsertTheAct = async (item) => {
  try {
    const query = `
      SELECT *
      FROM act_links
      WHERE name = :name
      LIMIT 1
    `;
    // Run the custom query with parameters
    let [actLink] = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
      replacements: { name: item.NAME },
    });

    if (!actLink) {
      console.log('Creating actLink');

      const query = `
      INSERT INTO act_links (name,
        url,
        pdf_url,
        is_active,
        state
        )
      VALUES (:name, 
        :url,
        :pdf_url,
        :is_active,
        :state
        )
        RETURNING *
        `;

      [actLink] = await sequelize.query(query, {
        type: Sequelize.QueryTypes.INSERT,
        replacements: {
          name: item.NAME,
          url: item.URL,
          pdf_url: item.PDF_URL,
          is_active: false,
          state: STATE,
        },
      });
      console.log('Created actLink');
    } else {
      // update
      // console.log('Updating actLink');
      // const query = `
      //   UPDATE act_links
      //   SET name = :name,
      //   pdf_url = :pdf_url
      //   is_active = :is_active
      //   state = :state
      //   WHERE leg_act_id = :legActId
      //   RETURNING *
      // `;
      // // Run the custom query with parameters
      // [actLink] = await sequelize.query(query, {
      //   type: Sequelize.QueryTypes.UPDATE,
      //   replacements: {
      //     title: item.NAME,
      //     url: item.URL,
      //     pdf_url: item.PDF_URL,
      //     is_active: false,
      //     legActId: actLink.act_link_id,
      //   },
      // });
      // console.log('Updated actLink');
    }
  } catch (err) {
    console.log('ERROR UPSERTING ACT LINK', err);
  }
};

const scrapeActiveActs = async () => {
  console.log('Starting scraping the active acts links');
  // start scraping for active act links and insert into acts, divisions and legislations
  try {
    const query = `
    SELECT *
    FROM act_links
    WHERE state = :state
    AND is_active= :is_active
  `;
    // Run the custom query with parameters
    let links = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
      replacements: { state: STATE, is_active: true },
    });
    console.log('links', links);
    // read pdf for each link and insert into acts, divisions and legislations
    links.forEach(async (link) => {
      await readURLAndInsertAddLegislation(link.pdf_url);
    });
    console.log('Reading pdf for active links and upserting legislations');
    // await readURLAndInsertAddLegislation(
    //   // 'https://www.legislation.qld.gov.au/view/pdf/inforce/current/act-1987-051'
    //   'https://www.legislation.qld.gov.au/view/pdf/inforce/current/sl-2019-0090'
    // );
  } catch (err) {
    console.log('Error scraping active acts data', err);
  }
};

const readURLAndInsertAddLegislation = async (url) => {
  try {
    // Download the PDF file
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const data = new Uint8Array(response.data);

    // Load the PDF data
    const loadingTask = PDFJS.getDocument(data);
    const pdfDocument = await loadingTask.promise;

    // Read the text from each page
    const numPages = pdfDocument.numPages;
    let text = '';

    // Exclude header and footer both
    for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
      const page = await pdfDocument.getPage(pageNumber);
      const content = await page.getTextContent();
      const filteredItems = content.items.filter((item) => {
        const itemY = item.transform[5];
        return itemY > HEADER_HEIGHT && itemY < page.view[3] - FOOTER_HEIGHT;
      });
      const pageText = filteredItems.map((item) => item.str).join(' ');
      text += pageText + '\n';
    }
    console.log(1);
    const title = getTitle(text);
    const effectiveDate = getDate(text);

    // Print the extracted text
    // console.log(text);
    console.log(2);
    // console.log(text);

    const regex = /Part \d+\s+[^0-9]+/g;
    // const matches = text.match(regex);
    // const partNames = matches.map((match) => match.trim());

    let partNames = [];
    let contentsLastIndex = 0;
    let match;
    while ((match = regex.exec(text))) {
      const partName = match[0].trim();
      if (partNames.includes(partName)) {
        break;
      }
      partNames.push(partName);
    }
    console.log('len', partNames.length);
    if (partNames.length) {
      contentsLastIndex = text.indexOf(partNames[partNames.length - 1]) + 10;
      text = text.substring(contentsLastIndex, text.length - 1);
      const results = partNames.map((name) => {
        const regex = new RegExp(name.replace(/\s+/g, '\\s+'));
        const match = regex.exec(text);
        if (match) {
          return { name, startIndex: match.index };
        }
        return { name };
      });

      // Find the second occurrence of each part and extract the corresponding text
      results.forEach((part, index) => {
        const nextPart = results[index + 1];
        if (nextPart) {
          const regex = new RegExp(part.name.replace(/\s+/g, '\\s+'), 'g');
          const matches = text.matchAll(regex);
          let count = 0;
          let endIndex;
          for (const match of matches) {
            count++;
            if (count === 2) {
              endIndex = match.index;
              break;
            }
          }
          if (endIndex) {
            part.text = text
              .substring(part.startIndex, endIndex)
              .replace(part.name, '')
              .trim();
          } else {
            part.text = text
              .substring(part.startIndex, nextPart.startIndex)
              .replace(part.name, '')
              .trim();
          }
        } else {
          part.text = text
            .substring(part.startIndex, text.length - 1)
            .replace(part.name, '')
            .trim();
        }
      });
      // console.log('===>', results, results.length);
      await sequelize.authenticate(); // Check the database connection
      console.log('db auth success');

      await createLegislation(title, effectiveDate, STATE, results, sequelize);
    } else {
      const delimiter = '. . . . . ';
      const lastIndex = text.lastIndexOf(delimiter);

      const substring = text.substring(lastIndex + delimiter.length);
      const index = substring.indexOf(title);

      const partText = substring.substring(index).replace(title, '').trim();

      console.log('No parts found: inserting the only part', title);
      // await sequelize.authenticate(); // Check the database connection
      console.log('db auth success');

      await createLegislation(
        title,
        effectiveDate,
        STATE,
        [{ name: title, text: partText }],
        sequelize
      );
    }
  } catch (error) {
    console.error('Error reading the PDF:', error);
  }
};

const createLegislation = async (
  title,
  effectiveDate,
  state,
  results,
  sequelize
) => {
  const query = `
      SELECT *
      FROM legislation_acts
      WHERE name = :title
      LIMIT 1
    `;
  // Run the custom query with parameters
  let [act] = await sequelize.query(query, {
    type: Sequelize.QueryTypes.SELECT,
    replacements: { title },
  });
  console.log('exist', act);

  if (!act) {
    console.log(act, 'Creating new act');

    const query = `
        INSERT INTO legislation_acts (name,
          state,
          key,
          can_show,
          is_latest,
          effective_date
          )
        VALUES (:title, :state,
          :key,
          :can_show,
          :is_latest,
          :effective_date
          )
        RETURNING *
      `;

    [act] = await sequelize.query(query, {
      type: Sequelize.QueryTypes.INSERT,
      replacements: {
        title,
        state,
        key: 'key',
        can_show: true,
        is_latest: true,
        effective_date: new Date(effectiveDate),
      },
    });
    act = act[0];
    console.log('Act just after created:', act);
  }

  console.log('Act:', act);

  results.forEach(async (div) => {
    const query = `
        SELECT *
        FROM legislation_divisions
        WHERE name = :name
        AND leg_act_id = :legActId
        LIMIT 1
      `;
    let [division] = await sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
      replacements: { name: div.name, legActId: act.leg_act_id },
    });
    if (!division) {
      // console.log(division, 'Creating new division');

      const query = `
          INSERT INTO legislation_divisions (name,
            leg_act_id,
            can_show
            )
          VALUES (:name,
            :legActId,
            :can_show
            )
          RETURNING *
        `;

      // console.log(act.leg_act_id);

      [division] = await sequelize.query(query, {
        type: Sequelize.QueryTypes.INSERT,
        replacements: {
          name: div.name,
          legActId: act.leg_act_id,
          can_show: true,
        },
      });
      division = division[0];
    }
    // console.log('Division:', division);

    const query2 = `
        SELECT *
        FROM legislations
        WHERE name = :name 
        AND description = :description
        LIMIT 1
      `;

    let [legislation] = await sequelize.query(query2, {
      type: Sequelize.QueryTypes.SELECT,
      replacements: { name: div.name, description: div.text },
    });
    if (!legislation) {
      // console.log(legislation, 'Creating new legislation');

      const query = `
          INSERT INTO legislations (name,
            description,
            leg_act_id,
            leg_div_id,
            can_show
            )
          VALUES (:name,
            :description,
            :legActId,
            :legDivId,
            :can_show
            )
          RETURNING *
        `;

      [legislation] = await sequelize.query(query, {
        type: Sequelize.QueryTypes.INSERT,
        replacements: {
          name: div.name,
          description: div.text,
          legActId: act.leg_act_id,
          legDivId: division.leg_div_id,
          can_show: true,
        },
      });
    }
    // console.log('Legislation:', legislation);
  });
};

const getTitle = (text) => {
  const startIndex = text.indexOf('Queensland ') + 'Queensland '.length;
  const endIndex = text.indexOf(' Current');
  return text.substring(startIndex, endIndex).trim();
};

const getDate = (text) => text.match(date_regex)[1];

export { addQLDActsLinks, scrapeActiveActs };
