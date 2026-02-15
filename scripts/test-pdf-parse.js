
const pdf = require("pdf-parse");
const axios = require("axios");

async function test() {
    try {
        const url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
        console.log("Fetching PDF from:", url);
        
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        
        console.log("pdf import type:", typeof pdf);
        console.log("pdf keys:", Object.keys(pdf));
        
        console.log("pdf.PDFParse type:", typeof pdf.PDFParse);

        let parseFunc = pdf;
        if (typeof pdf.PDFParse === 'function') {
            console.log("Using pdf.PDFParse");
            parseFunc = pdf.PDFParse;
        } else if (pdf.default) {
             parseFunc = pdf.default;
        }

        console.log("Parsing PDF buffer of size:", buffer.length);
        const data = await parseFunc(buffer);
        
        console.log("Success!");
        console.log("Text preview:", data.text.substring(0, 100));
        
    } catch (error) {
        console.error("Test failed:");
        if (error.response) {
            console.error(error.response.status, error.response.statusText);
        } else {
            console.error(error);
        }
    }
}

test();
