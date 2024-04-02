import puppeteer from "puppeteer";
import { writeFile } from "fs";

const googleFinance = 'https://www.google.com/finance/?hl=en'


const headless = async() => {
    try{
        const browser = await puppeteer.launch({
            headless: false
        });

        const page = await browser.newPage();
        await page.setViewport({
            width: 1080,
            height: 1024,
        });

        await page.goto(googleFinance);
        await page.waitForNetworkIdle();

        await page.waitForSelector('.sbnBtf.xJvDsc');

        const first3Data = await page.$$eval('.SxcTic.h6lQV', 
        (rows) => {
            return rows.map(stock => {
                return{
                    companyName: stock
                    .querySelector('.Q8lakc.W9Vc1e').textContent,
                    price: stock.querySelector('.JLPHhb').textContent,
                    change: stock.querySelector('.JwB6zf').textContent,
                }
            })
        });

        const last3Data = await page.$$eval('.JpmnWe', 
        (rows) => {
            return rows.map(stock => {
                return {
                    newsTittle: stock.querySelector('.yY6Ze').textContent,
                    source: stock.querySelector('.YrG3Pd').textContent
                }
            })
        });

        const combinedData = first3Data.map((data, index) => {
            const last3Item = last3Data[index];
            return {
                companyName: data.companyName,
                price: data.price,
                change: data.change,
                newsTitle: last3Item.newsTittle,
                newsSource: last3Item.source
            };
        });

        await writeFile('./data/mostActiveStocks', 
        JSON.stringify(combinedData),
        'utf-8', (error) => {
            if(error){
                console.log(error)
            }
            console.log('Saved file');
        });


        await new Promise(resolve => setTimeout(resolve, 1000));
        await browser.close();


    }catch(error){
        console.log(error)
    }
}

headless();