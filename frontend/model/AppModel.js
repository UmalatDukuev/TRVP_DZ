

export default class AppModel {

    static async getDests() {            // changed
        try{
            const destResponse = await fetch('http://localhost:4321/dests'); // get запрос по-умолчанию
            const destBody = await destResponse.json();

            if(destResponse.status !== 200){
                return Promise.reject(destBody);
            }

            return destBody.dests;
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    static async addDests({destID, name} = {        // changed
        destID: null,
        name: ''
    }) {
        try{
            //console.log("logging ",tripID, destID, ferryID, position);
            const addDestResponse = await fetch(
                'http://localhost:4321/dests',
                {
                    method: 'POST',
                    body: JSON.stringify({ destID, name }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            ); // get запрос по-умолчанию

            if(addDestResponse.status !== 200){
                const addDestBody = await addDestResponse.json();
                return Promise.reject(addDestBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Dest '${destID}' was successfully added to list of trips`
            };
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    static async getFerrys() {            // changed
        try{
            const ferryResponse = await fetch('http://localhost:4321/ferrys'); // get запрос по-умолчанию
            const ferryBody = await ferryResponse.json();

            if(ferryResponse.status !== 200){
                return Promise.reject(ferryBody);
            }

            return ferryBody.ferrys;
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    static async getLimits({tripID} = { tripID: null}) {            
        try{
            const limitResponse = await fetch(`http://localhost:4321/limit/${tripID}`); // get запрос по-умолчанию
            const limitBody = await limitResponse.json();

            if(limitResponse.status !== 200){
                return Promise.reject(limitBody);
            }

            return limitBody.limits;
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    static async getTrips() {            // changed
        try{
            const tripResponse = await fetch('http://localhost:4321/trips'); // get запрос по-умолчанию
            const tripBody = await tripResponse.json();

            if(tripResponse.status !== 200){
                return Promise.reject(tripBody);
            }

            return tripBody.trips;
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }


    static async addTrips({tripID, destID, ferryID, position = -1} = {        // changed
        tripID: null,
        ferryID: null,
        destID: null,
        position: -1
    }) {
        try{
            console.log("logging ",tripID, destID, ferryID, position);
            const addTripResponse = await fetch(
                'http://localhost:4321/trips',
                {
                    method: 'POST',
                    body: JSON.stringify({tripID, ferryID, destID, position}),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            ); // get запрос по-умолчанию

            if(addTripResponse.status !== 200){
                const addTripBody = await addTripResponse.json();
                return Promise.reject(addTripBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Trip '${tripID}' was successfully added to list of trips`
            };
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    static async updateTrip({tripID, destID, ferryID} = {   //пока что только название и позиция, добавить остальные штуки
        tripID: null,
        destID: null,
        ferryID: null
    }) {
        try{
            const updateTripResponse = await fetch(
                `http://localhost:4321/trips/${tripID}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ferryID, destID}),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            ); // get запрос по-умолчанию

            if(updateTripResponse.status !== 200){
                const updateTripBody = await updateTripResponse.json();
                return Promise.reject(updateTripBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Trip '${tripID}' was successfully updated`
            };
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }


    static async deleteTrip({tripID } = {             //changed
        tripID: null
    }) {
        try{
            const deleteTripResponse = await fetch(
                `http://localhost:4321/trips/${tripID}`,
                {
                    method: 'DELETE'
                }
            ); // get запрос по-умолчанию

            if(deleteTripResponse.status !== 200){
                const deleteTripBody = await deleteTripResponse.json();
                return Promise.reject(deleteTripBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Trip (ID = '${tripID}') was successfully deleted`
            };
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }


    static async addLoad({loadID, name, type, car_type, position, tripID = -1} = {   //changed
        loadID: null,
        name: '',
        type: '',
        car_type: 0,
        position: -1,
        tripID: null
    }) {
        try{
            const addLoadResponse = await fetch(
                'http://localhost:4321/loads',
                {
                    method: 'POST',
                    body: JSON.stringify({loadID, name, type, car_type, position, tripID}),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            ); // get запрос по-умолчанию

            if(addLoadResponse.status !== 200){
                const addLoadBody = await addLoadResponse.json();
                return Promise.reject(addLoadBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Load '${name}' was successfully added to trip`
            };
        } catch(err){
            //console.log('here!!!');
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    static async updateLoad({loadID, name, type, car_type, position = -1} = {   //пока что только название и позиция, добавить остальные штуки
        loadID: null,
        name: '',
        type:'',
        car_type: '',
        position: -1
    }) {
        try{
            const updateLoadResponse = await fetch(
                `http://localhost:4321/loads/${loadID}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({name, type, car_type, position}),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            ); // get запрос по-умолчанию

            if(updateLoadResponse.status !== 200){
                const updateLoadBody = await updateLoadResponse.json();
                return Promise.reject(updateLoadBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Load '${name}' was successfully updated`
            };
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    static async updateLoads({reorderedLoads = []} = {   // это вроде изменение позиции у нескольких грузов                
        reorderedLoads: []                               //changed
    }) {
        try{
            const updateLoadsResponse = await fetch(
                `http://localhost:4321/loads`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ reorderedLoads}),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            ); // get запрос по-умолчанию

            if(updateLoadsResponse.status !== 200){
                const updateLoadsBody = await updateLoadsResponse.json();
                return Promise.reject(updateLoadsBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Load was successfully changed`
            };
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }

    static async deleteLoad({loadID } = {             //changed
        loadID: null
    }) {
        try{
            const deleteLoadResponse = await fetch(
                `http://localhost:4321/loads/${loadID}`,
                {
                    method: 'DELETE'
                }
            ); // get запрос по-умолчанию

            if(deleteLoadResponse.status !== 200){
                const deleteLoadBody = await deleteLoadResponse.json();
                return Promise.reject(deleteLoadBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Load (ID = '${loadID}') was successfully delete from trip`
            };
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }


    static async moveLoad({loadID, srcTripID, destTripID} = {  //changed
        loadID: null,
        srcTripID: null,
        destTripID: null
    }) {
        try{
            const moveLoadResponse = await fetch(
                `http://localhost:4321/trips`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({loadID, srcTripID, destTripID}),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            ); // get запрос по-умолчанию

            if(moveLoadResponse.status !== 200){
                const moveLoadBody = await moveLoadResponse.json();
                return Promise.reject(moveLoadBody);
            }

            return {
                timestamp: new Date().toISOString(),
                message: `Load '${loadID}}' was successfully moved from ${srcTripID} to ${destTripID} `
            };
        } catch(err){
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: err.message
            });
        }
    }
}