import pg from 'pg';

export default class DB {
    #dbClient = null;
    #dbHost = '';
    #dbPort = '';
    #dbName = '';
    #dbLogin = '';
    #dbPassword = '';

    constructor(){
        this.#dbHost = process.env.DB_HOST;
        this.#dbPort = process.env.DB_PORT;
        this.#dbName = process.env.DB_NAME;
        this.#dbLogin = process.env.DB_LOGIN;
        this.#dbPassword = process.env.DB_PASSWORD;

        this.#dbClient = new pg.Client({
            user: this.#dbLogin,
            password: this.#dbPassword,
            host: this.#dbHost,
            port: this.#dbPort,
            database: this.#dbName
        })
    }

    async connect() {
        try{
            await this.#dbClient.connect();
            console.log('DB connection established');

        } catch(error){
            console.error('Unable to connect to DB: ', error);
            return Promise.reject(error);
        }
    }

    async disconnect() {
        try{
            await this.#dbClient.end();
            console.log('DB connection was closed');
            

        } catch(error){
            console.error('Unable to disconnect to DB: ', error);
            return Promise.reject(error);
            
        }
    }
    async

    async addDest({
        destID,
        name
    } = {
        destID: null,
        name: ''
    }){
        if(!destID || !name ){
            const errMsg = `Add destination error: wrong params (id: ${destID}, name: ${name})`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }

        try {
            await this.#dbClient.query(
                'insert into destination (id, name) values ($1, $2);',
                [destID, name]

            );

        } catch (error) {
            console.error('Unable add destination, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });

        }
    }

    async getTrips(){
        try {
            const trips = await this.#dbClient.query(
                'select trip.id, ferry.name as ferry_name, destination.name as dest_name, position, loads from trip\
                join ferry on (trip.ferry_id = ferry.id) \
                join destination on (trip.dest_id = destination.id)\
                order by position;'   //changed

            );
            return trips.rows;

        } catch (error) {
            console.error('Unable get list of trips, error: ', error);  //changed
            return Promise.reject({
                type: 'internal',
                error
            });

        }
    }
    async getLoads(){
        try {
            const loads = await this.#dbClient.query(
                'select * from load order by trip_id, position;' //changed

            );
            //console.log('loads::: ', loads);
            return loads.rows;

        } catch (error) {
            console.error('Unable get loads, error: ', error);    //changed
            return Promise.reject({
                type: 'internal',
                error
            });

        }
    }
    //подтягиваем пункты назначений из бд
    async getDests(){
        try {
            const dests = await this.#dbClient.query(
                'select * from destination order by name;' //changed

            );
            //console.log('loads::: ', loads);
            return dests.rows;

        } catch (error) {
            console.error('Unable get dests, error: ', error);    //changed
            return Promise.reject({
                type: 'internal',
                error
            });

        }
    }

    //подтягиваем паромы из бд
    async getFerrys(){
        try {
            const ferrys = await this.#dbClient.query(
                'select * from ferry order by name;' //changed

            );
            //console.log('loads::: ', loads);
            return ferrys.rows;

        } catch (error) {
            console.error('Unable get ferrys, error: ', error);    //changed
            return Promise.reject({
                type: 'internal',
                error
            });

        }
    }


    //подтягиваем паромы из бд
    async getLimits({tripID} = {tripID: null}){

        if (!tripID){
                const errMsg = `Get limits error: wrong params (id: ${tripID})`;
                console.error(errMsg);
                return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }

        try {
            
            const limits = await this.#dbClient.query(
                'select car_place, load_place from trip\
                join ferry on ferry.id = trip.ferry_id where trip.id = $1;\
                ', [tripID]
            );
            //console.log('loads::: ', loads);
            return limits.rows;

        } catch (error) {
            console.error('Unable get ferrys, error: ', error);    //changed
            return Promise.reject({
                type: 'internal',
                error
            });

        }
    }


    async addTrip({  // changed
        tripID,
        ferryID,
        destID,
        position = -1
    } = {
        tripID: null,
        ferryID: null,
        destID: null,
        position: -1
    }){
        if(!ferryID ||!destID ||!tripID || position < 0){
            const errMsg = `Add trip error: wrong params (id: ${tripID}, ferry_id: ${ferryID}, dest_id: ${destID},  position: ${position})`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }

        try {
            await this.#dbClient.query(
                'insert into trip (id, ferry_id, dest_id, position) values ($1, $2, $3, $4);',
                [tripID, ferryID, destID, position]

            );

        } catch (error) {
            console.error('Unable add trip, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });

        }
    }

    async updateTrip({  // changed
        tripID,
        ferryID,
        destID
        //position = -1
    } = {
        tripID: null,
        ferryID: null,
        destID: null
        //position: -1
    }){
        if(!ferryID ||!destID ||!tripID ){
            const errMsg = `Update trip error: wrong params (id: ${tripID}, ferry_id: ${ferryID}, dest_id: ${destID}`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }

        try {
            await this.#dbClient.query(
                'update trip set ferry_id = $1, dest_id = $2 where id = $3;',
                [ ferryID, destID, tripID]

            );

        } catch (error) {
            console.error('Unable update trip, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });

        }
    }


    async deleteTrip({ //changed
        tripID
    } = {
        tripID: null
    }){
        if(!tripID){
            const errMsg = `Delete load error: wrong params (id: ${tripID})`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }
        //console.log(tripID);
        try {
            // считаю что грузы с этого рейса были удалены, и теперь удаляем только сам рейс
            

            await this.#dbClient.query(
                'delete from trip where id = $1;',
                [tripID]

            );


        } catch (error) {
            console.error('Unable delete trip, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });

        }

    }


    async addLoad({ //changed
        loadID,
        name,
        type,
        car_type,
        position = -1,
        tripID
    } = {
        loadID: null,
        name: '',
        type: '',
        car_type: 0,
        position:-1,
        tripID: null
    }){
        if (!type){type = 'авто'}
        if(!tripID || !name || !type || position < 0 || !loadID){
            const errMsg = `Add load error: wrong params (id: ${loadID}, name: ${name}, type: ${type}, position: ${position}, tripId: ${tripID})`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }

        try {
            await this.#dbClient.query(
                'insert into load (id, name, type, car_type, trip_id, position) values ($1, $2, $3, $4, $5, $6);',
                [loadID, name, type, car_type, tripID, position]

            );
            await this.#dbClient.query(
                'update trip set loads = array_append(loads, $1) where id = $2;',
                [loadID, tripID]

            );

        } catch (error) {
            console.error('Unable add load, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });

        }
    }

    async updateLoad({ // теперь тут можно изменить все параметры, но надо задать прям всё заново(
        loadID,
        name,
        type,
        car_type,
        position = -1
    } = {
        loadID: null,
        name: '',
        type: '',
        car_type: ' ',
        position:-1,
    }){
        if((!name && !type && !car_type && position < 0) || !loadID){
            const errMsg = `Update load error: wrong params (id: ${loadID}, name: ${name}, position: ${position})`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }

        let query = null;
        const queryParams = [];
        if(name && type && car_type && position >= 0){// пока что я считаю что если изменяется то всё
            query = 'update load set name = $1, type = $2, car_type = $3, position = $4 where id = $5;';
            queryParams.push(name, type, car_type, position, loadID);
        } else if(name){
            
            query = 'update load set name = $1 where id = $2;';
            queryParams.push(name, loadID);
            
        } else {
            query = 'update load set position = $1 where id = $2;';
            queryParams.push(position, loadID);
        }
        try {
            await this.#dbClient.query(
                query,
                queryParams
            );

        } catch (error) {
            console.error('Unable update load, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });

        }

    }

    async deleteLoad({ //changed
        loadID
    } = {
        loadID: null
    }){
        if(!loadID){
            const errMsg = `Delete load error: wrong params (id: ${loadID})`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }
        console.log(loadID);
        try {

            const queryResult = await this.#dbClient.query(
                'select trip_id from load where id = $1;',
                [loadID]

            );
            const {trip_id: tripID} = queryResult.rows[0];
            await this.#dbClient.query(
                'delete from load where id = $1;',
                [loadID]

            );
            await this.#dbClient.query(
                'update trip set loads = array_remove(loads, $1) where id = $2;',
                [loadID, tripID]

            );

        } catch (error) {
            console.error('Unable delete load, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });

        }

    }


    async moveLoad({  //добавить сюда проверки !!!! чтобы не превышало количества мест на пароме , а сюда ли их надо добавить вообще?
        loadID,
        srcTripID,
        destTripID
    } = {
        loadID: null,
        srcTripID: null,
        destTripID: null
    }){
        if(!loadID || !srcTripID || !destTripID){
            const errMsg = `Move load error: wrong params (id: ${loadID}, srcID: ${srcTripID}, destID: ${destTripID})`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }

        try {

            await this.#dbClient.query(
                'update load set trip_id = $1 where id = $2;',
                [destTripID, loadID]

            );
            
            await this.#dbClient.query(
                'update trip set loads = array_append(loads,$1) where id = $2;',
                [loadID, destTripID]

            );
            await this.#dbClient.query(
                'update trip set loads = array_remove(loads, $1) where id = $2;',
                [loadID, srcTripID]

            );

        } catch (error) {
            console.error('Unable move load, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });

        }

    }
};