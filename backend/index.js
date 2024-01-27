import dotenv from 'dotenv';
import express, { response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url'
import DB from './db/client.js';
import { timeStamp } from 'console';

const __filename = fileURLToPath(import.meta.url); //полный путь к файлу
const __dirname = path.dirname(__filename);   //полный путь к директории


console.log(__filename, __dirname);

dotenv.config(
    {
        path: './backend/.env'
    }
);

const appHost = process.env.APP_HOST;
const appPort = process.env.APP_PORT;

console.log(appHost, appPort);
console.log(process.env);

const app = express();
const db = new DB();

// logginn middleware
app.use('*', (req, res, next) => {
    
    console.log(
        req.method,
        req.baseUrl || req.url,
        new Date().toISOString()
    );
    next(); // следующий обработчик
});

// middleware for static app files
app.use('/', express.static(path.resolve(__dirname, '../dist')));

// get dests
app.get('/dests', async (req, res) => {    //changed
    try {
        const [dbDests] = await Promise.all([db.getDests()]);
        
        const dests = dbDests.map(({id, name}) => ({
            destID: id, name
        })); 

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.json({ dests });


    } catch (err) {
        res.statusCode = 500;
        res.statusMessage = 'Internal server error';
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: 500,
            message: `Getting dests error: ${err.error.message || err.error}`
        });
    }
});

// добавление пункта назначения
app.use('/dests', express.json())
app.post('/dests', async (req, res) => {     //changed
    try{
        const { destID, name } = req.body;
        await db.addDest({ destID, name });
        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();

    } catch(err) {
        switch(err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
     
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Add destination error: ${err.error.message || err.error}`
        });
    }
});


// get ferrys
app.get('/ferrys', async (req, res) => {    //changed
    try {
        const [dbFerrys] = await Promise.all([db.getFerrys()]);
        
        const ferrys = dbFerrys.map(({id, name, car_place, load_place}) => ({
            ferryID: id, name, car_place, load_place
        })); 

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.json({ ferrys });


    } catch (err) {
        res.statusCode = 500;
        res.statusMessage = 'Internal server error';
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: 500,
            message: `Getting ferrys error: ${err.error.message || err.error}`
        });
    }
});


// get limits
app.get('/limit/:tripID', async (req, res) => {    //changed
    try {
        const {tripID} = req.params;
        const [dbLimits] = await Promise.all([db.getLimits({ tripID })]);
        
        const limits = dbLimits.map(({car_place, load_place}) => ({
            car_place: car_place, load_place: load_place
        })); 

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.json({ limits });


    } catch (err) {
        res.statusCode = 500;
        res.statusMessage = 'Internal server error';
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: 500,
            message: `Getting limits error: ${err.error.message || err.error}`
        });
    }
});



// get trips and loads
app.get('/trips', async (req, res) => {    //changed
    try {
        const [dbTrips, dbLoads] = await Promise.all([db.getTrips(),db.getLoads()]);
        
        const loads = dbLoads.map(({id, name, type, car_type, position}) => ({
            loadID: id, name: name, type: type, car_type: car_type, position: position
        })); 
        //console.log('see_loads ',loads)

        const trips = dbTrips.map(trip => ({
            tripID: trip.id,
            ferryName: trip.ferry_name,
            destName: trip.dest_name,
            position: trip.position,
            loads: loads.filter(load => trip.loads.indexOf(load.loadID) !== -1)
        }));

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.json({ trips });


    } catch (err) {
        res.statusCode = 500;
        res.statusMessage = 'Internal server error';
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: 500,
            message: `Getting trips and loads error: ${err.error.message || err.error}`
        });
    }
});
// body parsing middleware
app.use('/trips', express.json())
app.post('/trips', async (req, res) => {     //changed
    try{
        const { tripID, ferryID, destID, position } = req.body;
        await db.addTrip({ tripID, ferryID, destID, position});
        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();

    } catch(err) {
        switch(err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
     
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Add trip error: ${err.error.message || err.error}`
        });
    }
});

app.delete('/trips/:tripID', async (req, res) => {           //changed
    try{
        const { tripID } = req.params;
        await db.deleteTrip({ tripID });

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();

    } catch(err) {
        switch(err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Delete trip error: ${err.error.message || err.error}`
        });
    }
});


// body parsing middleware
app.use('/loads', express.json())
// add load
app.post('/loads', async (req, res) => {              //changed
    try{
        const { loadID, name, type, car_type, position, tripID} = req.body;
        await db.addLoad({ loadID, name, type, car_type, position, tripID});
        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();

    } catch(err) {
        switch(err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Add load error: ${err.error.message || err.error}`
        });
    }
});

// body parsing middleware
app.use('/loads/:loadID', express.json());
// edit load params
app.patch('/loads/:loadID', async (req, res) => {  // пока будет меняться только название и позиция
    try{
        const {loadID} = req.params;
        const { name, type, car_type, position} = req.body;
        await db.updateLoad({ loadID, name, type, car_type, position});
        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();

    } catch(err) {
        switch(err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Update load params error: ${err.error.message || err.error}`
        });
    }
});

// edit several tasks position
app.patch('/loads', async ( req, res) => {   //тут меняются только позиции
    try{
        const { reorderedLoads } = req.body;

        await Promise.all(reorderedLoads.map(({ loadID, position}) => db.updateLoad({ loadID,  position})));
        
        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();

    } catch(err) {
        switch(err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Update loads error: ${err.error.message || err.error}`
        });
    }
});

// delete task
app.delete('/loads/:loadID', async (req, res) => {           //changed
    try{
        const { loadID } = req.params;
        await db.deleteLoad({ loadID });

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();

    } catch(err) {
        switch(err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Delete load error: ${err.error.message || err.error}`
        });
    }
});

// edit trip params
app.patch('/trips/:tripID', async (req, res) => {  //changed
    try{
        const {tripID} = req.params;
        const { ferryID, destID} = req.body;
        await db.updateTrip({ tripID, ferryID, destID});
        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();

    } catch(err) {
        switch(err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Update trip params error: ${err.error.message || err.error}`
        });
    }
});



// move loads between trips
app.patch('/trips', async (req, res) => {               //changed
    try{
        const {loadID, srcTripID, destTripID } = req.body;
        await db.moveLoad({loadID, srcTripID, destTripID});

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();

    } catch(err) {
        switch(err.type){
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Move load error: ${err.error.message || err.error}`
        });
    }
})




const server = app.listen(Number(appPort), appHost, async () => {             //changed

    try{
        await db.connect()
    } catch(error){
        console.log('Load manager app shut down');
        process.exit(100);
    }

    console.log(`Load manager app started at host http://${appHost}:${appPort}`);

    console.log(await db.getTrips());
    // await db.moveTask({
    //     taskID: '8384e864-d359-4c38-b3a8-1e0dd929cbd0',
    //     srcTasklistID: 'bdde8b73-e5d3-4972-91cc-fab71967f55c',
    //     destTasklistID: 'e550ac89-c93c-4944-aee5-9f4d65e9b7c7'
    // });
    // console.log(await db.getTaskLists());
    // console.log(await db.getTasks());
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closed HYYP server')
    server.close(async () => {
        await db.disconnect();
        console.log('HTTP server closed');
    });
});