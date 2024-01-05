# Legislation-Scraping-Backend

The Legislative Data Extraction Tool is a backend service designed to fetch and process legislative content from various UK government websites. Using Node.js, it extracts information like bills, acts, and regulations, transforming them into accessible PDF and CSV formats. This data is then stored in a PostgreSQL database for efficient handling and analysis.

## Participation and Improvement

Contributions to Legislation-Scraping-Backend are welcome! If you find any issues or want to add new features, feel free to submit a pull request. Please follow the existing code style and include appropriate tests.

## Features

### Data Harvesting

- Employs Node.js with the Cheerio library for data harvesting
- Targets multiple UK states' government sites for legislative information
- Retrieves bill titles, summaries, dates, and related documents

### Document Generation in PDF

- Transforms harvested data into PDFs
- Creates comprehensive PDFs with detailed bill information

### CSV File Creation

- Converts harvested data into CSV format
- Produces CSV files for streamlined data analysis and external tool compatibility

### Data Management with PostgreSQL

- Uses PostgreSQL to store harvested data
- Facilitates advanced data management and retrieval
- Supports quick searching and indexing for accessible data

## Technologies Utilized

- Node.js: A JavaScript runtime for executing server-side applications
- Cheerio: A fast and flexible web scraping library for Node.js
- PDFKit: A PDF generation library for Node.js
- CSVWriter: A library for generating CSV files in Node.js
- PostgreSQL: A powerful relational database for storing and managing structured data

## Setup Guide

### Requirements

- Node.js (v14 or higher)
- PostgreSQL database

### Steps for Installation

1. Repository Cloning:

   ````shell
   git clone https://github.com/areesha1122/legislation-scraping
   ```

   ````

2. Dependency Installation:

   ````shell
   cd legislation-scraping-backend
   npm install
   ```

   ````

3. Configuration of Environment:

   Create a `.env` file in the root directory and add the following environment variables:

   ````plaintext
   DATABASE_URL=your-postgresql-database-url
   ```

   Substitute `your-postgresql-database-url` with your actual database URL.

   ````

4. Starting the Server:

   ````shell
   npm start
   ```
   ````

## Operational Usage

Once the server is up and running, you can initiate the scraping process to gather legislative data from the different states' government websites. The scraped data can then be converted into PDFs or CSVs for further analysis and stored in the PostgreSQL database.

The specific implementation details, such as the states' government websites to scrape and the structure of the stored data, will depend on your project requirements. You can customize the scraping logic, PDF/CSV conversion, and database interactions accordingly.

## Credits

Gratitude is extended to:

- [Node.js](https://nodejs.org)
- [Cheerio](https://cheerio.js.org)
- [PDFKit](http://pdfkit.org)
- [CSVWriter](https://github.com/ryu1kn/csv-writer)
- [PostgreSQL](https://www.postgresql.org)
- Any other libraries or resources used in your implementation

## Contact Information

For inquiries or suggestions about the Legislative Data Extraction Tool, please contact:

- Email: [contact@legislation-scraping.com](mailto:contact@legislation-scraping.com)
- Website: [https://legislation-scraping.com](https://legislation-scraping.com)
- GitHub: [https://github.com/areesha1122](https://github.com/areesha1122)

## Licensing

This project is licensed under the [MIT License](LICENSE). Feel free to use it for your own projects.
