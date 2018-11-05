// REQUERIMOS EL MÓDULO DE EXPRESS
const expressLib = require("express")

// REQUERIMOS MÓDULO PARA VISTAS BASADO EN EJS
const ejsLib = require("ejs")

// REQUERIMOS BODY-PARSER PARA EL PARSEO DE LOS FORMULARIOS
const bodyParserLib = require("body-parser")
// OBJETO PARSEADOR urlencoded DE BODY-PASER
var urlencodedParser = bodyParserLib.urlencoded({ extended: false });

// REQUERIMOS MÓDULO PARA MONGODB Y LO INSTANCIAMOS ESTATICAMENTE
const mongodbLib = require("mongodb").MongoClient

// REQUERIMOS MULTER PARA EL PARSEO DE LOS FORMULARIOS Y SUBIDA DE ARCHIVOS
// const multerLib = require("multer")




// INSTANCIAMOS LA LIBRERIA DE EXPRESS COMO UNA APLICACION
var appExpress = expressLib()

// DEFINIMOS EJS COMO EL ENGINE PARA LAS VISTAS
appExpress.set("view engine", "ejs")

// DEFINIMOS LA RUTA DE DIRECTORIO views COMO UN RECURSO "PUBLICADO" EN LA RUTA VIRTUAL DE EXPRESS
appExpress.use(expressLib.static("views"))

// HABILITAMOS BODY-PARSER COMO PARSER JSON
appExpress.use(bodyParserLib.json());

// LIBRERIA PARA RECIBIR PAGOS https://github.com/conekta/conekta-node
const conektaLib = require('conekta');

// LLAVE PUBLICA https://admin.conekta.com/settings/keys
conektaLib.api_key = 'key_-------------';
conektaLib.locale = 'es';

conektaLib.api_version = '2.0.0';

///////////////////////////////////////////////////////////////////////////////////////////



// RUTA PARA RAIZ DE APLICACIÓN
appExpress.get("/", function(request, response) {
    console.log("/")

    // CONECTAMOS AL HOST QUE HOSPEDA MONGODB
    mongodbLib.connect("mongodb://localhost:27017", function(err, client) {
        // DEFINIMOS LA DB A USAR CON LA CONEXIÓN AL HOST    
        const dbClient = client.db("etickets")

        // GUARDAMOS LA INFORMACIÓN DEL FORMULARIO EN LA COLECCIÓN
        dbClient.collection("events").find({}).toArray(function(err, docs) {
            console.log(docs)
            // response.render("events/index", { eventData : docs } )
            response.render("default-page", { eventData : docs } )
        })

        client.close()
    })

    // response.render("default-page")
})

// RUTA PARA event-branding
appExpress.get("/event-branding/:id", function(request, response) {
    console.log("/event-branding/" + request.params.id)
    response.render("event-branding-page")
})

// RUTA PARA LISTA DE EVENTS
appExpress.get("/events", function(request, response) {
    console.log("/events")

    // CONECTAMOS AL HOST QUE HOSPEDA MONGODB
    mongodbLib.connect("mongodb://localhost:27017", function(err, client) {
        // DEFINIMOS LA DB A USAR CON LA CONEXIÓN AL HOST    
        const dbClient = client.db("etickets")

        // GUARDAMOS LA INFORMACIÓN DEL FORMULARIO EN LA COLECCIÓN
        dbClient.collection("events").find({}).toArray(function(err, docs) {
            console.log(docs)
            response.render("events/index", { eventData : docs } )
        })

        client.close()
    })
})

// RUTA PARA FORM CREATE DE EVENTS
appExpress.get("/events/create", function(request, response) {
    console.log("/events/create")

    let eventData = [
        {
            "displayModeOfForm" : "create"
        },
        {
            "sortname" : "",
            "longname" : "",
            "description" : "",
            "date" : "",
            "time" : "",
            "quota" : "",
            "price" : "",
            "img_branding" : ""
        }
    ]

    response.render("events/form", { eventData : eventData } )
})

// RUTA PARA GUARDAR NUEVO ELEMENTO DE EVENTS PROVENIENTE DEL FORM
appExpress.post("/events/post", urlencodedParser, function(request, response) {
    console.log("/events/post: " + request.body.sortname)

    // NOS ASEGURAMOS QUE VENGA LA ESTRUCTURA DEL FORMULARIO
    if (!request.body) return response.render("error-page", { error: "Formulario en blanco"})// res.sendStatus(400)

    // ESTRUCTURA PRINCIPAL DEL EVENTO AL CUAL SE LE AGREGÓ EL ÚLTIMO CAMPO (tickets_purchased) DONDE SE ALMACENARÁN LAS COMPRAS
    let eventData = {
            "sortname" : request.body.sortname,
            "longname" : request.body.longname,
            "description" : request.body.description,
            "date" : request.body.date,
            "time" : request.body.time,
            "quota" : parseInt(request.body.quota),
            "remaining" : parseInt(request.body.quota),
            "price" : parseFloat(request.body.price),
            "img_branding" : request.body.img_branding,
            "tickets_purchased" : []
        }

    // CONECTAMOS AL HOST QUE HOSPEDA MONGODB
    mongodbLib.connect("mongodb://localhost:27017", function(err, client) {
        // DEFINIMOS LA DB A USAR CON LA CONEXIÓN AL HOST    
        const dbClient = client.db("etickets")

        // GUARDAMOS LA INFORMACIÓN DEL FORMULARIO EN LA COLECCIÓN. SE PUDO ENVIAR DIRECTAMENTE LA INFORMACIÓN DE request.body
        dbClient.collection("events").save(eventData, function (err, result) {
            if (err) return response.render("error-page", { error :  err })
        })

        client.close()
    })

    // RENDERIZAMOS EN EL FORM LOS DATOS QUE RECIÉN SE GAURDARON CON LA MODALIDAD DE READ
    response.render("events/form", { eventData : [ { "displayModeOfForm" : "read" }, eventData ] } )
})

// RUTA PARA FORM UPDATE DE EVENTS
appExpress.get("/events/update/:id", function(request, response) {
    console.log("/events/update: " + request.params.id)

    // MECANISMO DE CONSULTA TOMADO DE: https://stackoverflow.com/questions/12769252/querying-a-mongodb-based-on-mongo-id-in-a-node-js-app
    // var BSON = require("mongodb").BSONPure
    var ObjectID = require("mongodb").ObjectID
    var obj_id = new ObjectID(request.params.id)

    // CONECTAMOS AL HOST QUE HOSPEDA MONGODB
    mongodbLib.connect("mongodb://localhost:27017", function(err, client) {
        // DEFINIMOS LA DB A USAR CON LA CONEXIÓN AL HOST    
        const dbClient = client.db("etickets")

        // GUARDAMOS LA INFORMACIÓN DEL FORMULARIO EN LA COLECCIÓN
        dbClient.collection("events").findOne( { _id : obj_id }, function(err, docs) {
            console.log(docs)
            response.render("events/form", { eventData : [ { displayModeOfForm : "update" } , docs ] } )
        })

        client.close()
    })
})

// RUTA PARA ACTUALIZAR ELEMENTO DE EVENTS PROVENIENTE DEL FORM
appExpress.post("/events/put", urlencodedParser, function(request, response) {
    console.log("/events/put: " + request.body.sortname)

    // NOS ASEGURAMOS QUE VENGA LA ESTRUCTURA DEL FORMULARIO
    if (!request.body) return response.render("error-page", { error: "Formulario en blanco"})// res.sendStatus(400)

    // CONSTRUIMOS LA ESTRUCTURA EN BASE AL FORMULARIO OMITIENDO EL ObjectID
    let eventData = {
            "sortname" : request.body.sortname,
            "longname" : request.body.longname,
            "description" : request.body.description,
            "date" : request.body.date,
            "time" : request.body.time,
            "quota" :request.body.quota,
            "price" : request.body.price,
            "img_branding" : request.body.img_branding
        }

    // CONECTAMOS AL HOST QUE HOSPEDA MONGODB
    mongodbLib.connect("mongodb://localhost:27017", (err, client) => {
        // DEFINIMOS LA DB A USAR CON LA CONEXIÓN AL HOST    
        const dbClient = client.db("etickets")

        var ObjectID = require("mongodb").ObjectID
        var obj_id = new ObjectID(request.body._id)

        // GUARDAMOS LA INFORMACIÓN DEL FORMULARIO EN LA COLECCIÓN
        // INFORMACIÓN CONCRETA ENCONTRADA EN: https://stackoverflow.com/questions/48108996/nodejs-mongodb-how-to-fix-update-operation-document-must-contain-atomic-operat
        // IMPORTANTE: NO INCLUIR EL "_id" (ObjectID) DENTRO DE LA ESTRUCTURA DE ACTUALIZACIÓN
        dbClient.collection("events").updateOne({ _id : obj_id }, { $set : eventData })

        client.close()
    })

    // RENDERIZAMOS LOS DATOS QUE RECIÉN SE GAURDARON
    response.render("events/form", { eventData : [ { displayModeOfForm : "read" } , eventData ] } )
})

// RUTA PARA ELIMINAR ELEMENTO DEL LISTADO DE EVENTS
appExpress.get("/events/delete/:id", function(request, response) {
    console.log("/events/delete: " + request.params.id)

    // CONECTAMOS AL HOST QUE HOSPEDA MONGODB
    mongodbLib.connect("mongodb://localhost:27017", (err, client) => {
        // DEFINIMOS LA DB A USAR CON LA CONEXIÓN AL HOST    
        const dbClient = client.db("etickets")

        var ObjectID = require("mongodb").ObjectID
        var obj_id = new ObjectID(request.params.id)

        // GUARDAMOS LA INFORMACIÓN DEL FORMULARIO EN LA COLECCIÓN
        // INFORMACIÓN CONCRETA ENCONTRADA EN: https://stackoverflow.com/questions/48108996/nodejs-mongodb-how-to-fix-update-operation-document-must-contain-atomic-operat
        // IMPORTANTE: NO INCLUIR EL "_id" (ObjectID) DENTRO DE LA ESTRUCTURA DE ACTUALIZACIÓN
        dbClient.collection("events").deleteOne({ _id : obj_id }, function(err, result) {
            if (err)
                console.log(err)
            else console.log("Documento eliminado")
        })

        client.close()
    })

    // DESPUES DE ELIMINAR REGRESAMOS AL LISTADO AUTOMÁTICAMENTE
    response.redirect("/events")
})

// RUTA PARA MOSTRAR EL DETALLE DE UN EVENTO, INCLUYENDO LOS BOLETOS VENDIDOS
appExpress.get("/events/view/:id", function(request, response) {
    console.log("/events/view: " +  request.params.id)

    // CONECTAMOS AL HOST QUE HOSPEDA MONGODB
    mongodbLib.connect("mongodb://localhost:27017", function(err, client) {
        // DEFINIMOS LA DB A USAR CON LA CONEXIÓN AL HOST    
        const dbClient = client.db("etickets")

        var ObjectID = require("mongodb").ObjectID
        var obj_id = new ObjectID(request.params.id)

        // CONSULTAMOS Y VISUALIZAMOS EL DETALLE DEL OBJETO
        dbClient.collection("events").findOne( { _id : obj_id }, function(err, docs) {
            console.log(docs)
            response.render("events/view", { eventData : docs } )
        })

        client.close()
    })
})

// RUTA PARA RENDERIZAR LA COMPRA DE BOLETOS DE DETERMINADO EVENTO
appExpress.get("/tickets/purchase/:id", function(request, response) {
    console.log("/tickets/purchase: " + request.params.id)

    // CONECTAMOS AL HOST QUE HOSPEDA MONGODB
    mongodbLib.connect("mongodb://localhost:27017", function(err, client) {
        // DEFINIMOS LA DB A USAR CON LA CONEXIÓN AL HOST    
        const dbClient = client.db("etickets")

        var ObjectID = require("mongodb").ObjectID
        var obj_id = new ObjectID(request.params.id)

        // GUARDAMOS LA INFORMACIÓN DEL FORMULARIO EN LA COLECCIÓN
        dbClient.collection("events").findOne( { _id : obj_id }, function(err, docs) {
            console.log(docs)
            response.render("tickets/purchase", { eventData : docs } )
        })

        client.close()
    })
})

// RUTA PARA PROCESAR LA TRANSACCION DE COMPRA DE TICKETS
appExpress.post("/tickets/put", urlencodedParser, function(request, response) {
    console.log("/tickets/put")

    // NOS ASEGURAMOS QUE VENGA LA ESTRUCTURA DEL FORMULARIO
    if (!request.body) return response.render("error-page", { error: "Formulario en blanco"})// res.sendStatus(400)

    // CONSTRUIMOS LA ESTRUCTURA EN BASE AL FORMULARIO OMITIENDO EL ObjectID
    let eventData = {
                        "date" : (new Date).toISOString().substring(0, 10),
                        "time" : (new Date).toLocaleTimeString("es-MX"), // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString
                        "customer" : {
                            "firstname" : request.body.firstname,
                            "lastname" : request.body.lastname,
                            "phone" : request.body.phone,
                            "email" : request.body.email
                        },
                        "quantity" : request.body.quantity
                    }

    // CONECTAMOS AL HOST QUE HOSPEDA MONGODB
    mongodbLib.connect("mongodb://localhost:27017", function(err, client) {
        // DEFINIMOS LA DB A USAR CON LA CONEXIÓN AL HOST    
        const dbClient = client.db("etickets")

        var ObjectID = require("mongodb").ObjectID
        var obj_id = new ObjectID(request.body._id)

        // GUARDAMOS LA INFORMACIÓN DEL FORMULARIO EN EL CAMPO DEL ARREGLO CON $push : https://www.w3resource.com/mongodb/mongodb-array-update-operator-$push.php
        // https://mongodb.github.io/node-mongodb-native/markdown-docs/insert.html 
        dbClient.collection("events").updateOne({ _id : obj_id }, { $push : { tickets_purchased : eventData } }, function(err, doc) { // save(eventData, function (err, result) {
            // if (err) return response.render("error-page", { error :  err })
            if (err) console.log("ERROR: " + err)
        })

        
        
        // AFECTACION PARA DECREMENTAR LA DISPONIBILIDAD DE BOLETOS
        dbClient.collection("events").updateOne({ _id : obj_id }, { $inc : { remaining : -parseInt(request.body.quantity) } }, function(err, doc) { // save(eventData, function (err, result) {
            // if (err) return response.render("error-page", { error :  err })
            if (err) console.log("ERROR: " + err)
        })





        // CONSULTAMOS Y VISUALIZAMOS EL DETALLE DEL EVENTO PARA TRAER SUS CAMPOS Y COMPLEMENTAR LA TRANSACCION DE CONEKTA
        dbClient.collection("events").findOne( { _id : obj_id }, function(err, docs) {
            console.log(docs)
            
            // CÓDIGO PARA HACER UNA PRUEBA DE TRANSACCIÓN DE PAGO POR Conekta
            // EL CAMPO DE MONTO ES CON CENTAVOS, SE TIENE QUE MULTIPLICAR POR 100
            conektaLib.Order.create({
                "currency": "MXN",
                "customer_info": {
                    "name": request.body.firstname + " " + request.body.lastname,
                    "phone": request.body.phone,
                    "email": request.body.email
                },
                "line_items": [{
                    "name": "ticket",
                    "description": docs.description,
                    "unit_price": parseFloat(docs.price)*100,
                    "quantity": request.body.quantity,
                    "tags": [docs.sortname],
                    "type": "physical"
                }]
            }, function(err, res) {
                if (err) {
                    console.log(err.type);
                    return;
                }
                console.log(res.toObject());
            });
        })


        client.close()
    })


    





    // RENDERIZAMOS EN EL FORM LOS DATOS QUE RECIÉN SE GAURDARON CON LA MODALIDAD DE READ
    // response.render("events/form", { eventData : [ { "displayModeOfForm" : "read" }, eventData ] } )
    response.send("INSERCION")
})


// POSICIONAMOS LA APLICACION EN EL PUERTO 3000/TCP
appExpress.listen(3000, function() {
    console.log("Aplicación ejecutándose ...")
})
