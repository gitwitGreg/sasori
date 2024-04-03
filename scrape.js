import puppeteer from "puppeteer";
import { writeFile } from "fs";
import * as xlsx from 'xlsx/xlsx.mjs'
import { json2csv } from "json-2-csv";
import fs from 'fs'


const googleFinance = 'https://www.google.com/finance/?hl=en'


const headless = async() => {
    try{
        const browser = await puppeteer.launch({
            headless: true
        });

        const page = await browser.newPage();

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


        writeFile('./data/mostActiveStocks.json',
            JSON.stringify(combinedData),
            'utf-8', (error) => {
                if (error) {
                    console.log(error);
                }
        });

        await page.click('.n4DWob');
        await page.waitForNetworkIdle();


        await page.click('.TkxCr')
        await page.waitForNetworkIdle();
        await page.waitForSelector('.SxcTic ')


        const gainers = await page.evaluate(
            () => {
                const rows = document.querySelectorAll('.SxcTic ');
                return Array.from(rows).map(stock => {
                    return{
                        companyName: stock.querySelector('.ZvmM7').textContent,
                        price: stock.querySelector('.Bu4oXd').textContent,
                        change: document.querySelector('.P2Luy.Ez2Ioe').textContent,
                        growthPercent: stock.querySelector('.JwB6zf').textContent,
                    }
                })
            }
        );

        writeFile('./data/topGainers.json',
        JSON.stringify(gainers), 'utf-8',
        (error) => {
            if(error){
                console.log('error saving file')
            }
        });

        await page.waitForSelector('.GqNdIe')

        const buttons = await page.$$('.GqNdIe');
        const buttonToClick = buttons[buttons.length - 2];
        
        await buttonToClick.click();
        await page.waitForNetworkIdle();
        await new Promise(resolve =>  setTimeout(resolve, 4000))

        const bitCoins= await page.evaluate(
            () => {
                const rows = document.querySelectorAll('.SxcTic ');
                return Array.from(rows).map(stock => {
                    return{
                        companyName: stock.querySelector('.ZvmM7').textContent,
                        price: stock.querySelector('.Bu4oXd').textContent,
                        change: document.querySelector('.P2Luy.Ez2Ioe').textContent,
                        growthPercent: stock.querySelector('.JwB6zf').textContent,
                    }
                })
            }
        );

        const filteredCoins = bitCoins.slice(-75);

        writeFile('./data/bitCoins.json', 
        JSON.stringify(filteredCoins), 'utf-8',
        (error) => {
            if(error){
                console.log(error)
            }
            console.log('bitcoin file saved')
        })

        await page.waitForNetworkIdle();


        const bit2Csv = json2csv(filteredCoins);
        const mostActiveCsv = json2csv(combinedData);
        const gainsCsv = json2csv(gainers);

        const parseCsv = (file) => {
            return file.split('\n')
            .map(row => row.split(','));
        }

        const bitParsed = parseCsv(bit2Csv);
        const mostActiveParsed = parseCsv(mostActiveCsv);
        const gainsParsed = parseCsv(gainsCsv)


        const wb = xlsx.utils.book_new();

        try{
            const bit2sheet = xlsx.utils.aoa_to_sheet(bitParsed);
            const mostActivesheet = xlsx.utils.aoa_to_sheet(mostActiveParsed);
            const gainssheet = xlsx.utils.aoa_to_sheet(gainsParsed);
            
            xlsx.utils.book_append_sheet(wb, bit2sheet, 'cryptoSheet');
            xlsx.utils.book_append_sheet(wb, mostActivesheet, 'mostActiveSheet');
            xlsx.utils.book_append_sheet(wb, gainssheet, 'TopGainerSheet');
            xlsx.set_fs(fs);
            xlsx.writeFile(wb, 'output.xlsx');
        }catch(error){
            
        }

        await browser.close();

    }catch(error){
        console.log(error)
    }
}

headless();