require('dotenv').config()
var express = require('express');
var app = express();
var cors = require('cors');
var azure = require('azure-storage');
var bodyParser = require('body-parser')

app.use(cors());
app.use(bodyParser.json());

const TABLE_NAME = 'thingTable';
const TABLE_PKEY = 'things';

// Only used for init the table
var thing_data = [
      { id: 10, name: 'ZX Spectrum', photo: 'zx-spectrum.jpg', likes: 11, desc: 'The ZX Spectrum is an 8-bit personal home computer released in the United Kingdom in 1982 by Sinclair Research. It was launched as the ZX Spectrum by Sinclair to highlight the machine\'s colour display, compared with the black and white of its predecessor, the ZX81. The Spectrum was released as eight different models, ranging from the entry level with 16 KB RAM released in 1982 to the ZX Spectrum +3 with 128 KB RAM and built in floppy disk drive in 1987; together they sold in excess of 5 million units worldwide' },
      { id: 11, name: 'Commodore 64', photo: 'c64.jpg', likes: 9, desc: 'The Commodore 64, also known as the C64 or occasionally CBM 64 is an 8-bit home computer introduced in January 1982 by Commodore International. It is listed in the Guinness World Records as the highest-selling single computer model of all time, with independent estimates placing the number sold between 10 and 17 million units. The C64 took its name from its 64 kilobytes (65,536 bytes) of RAM. It had superior sound and graphical specifications compared to other earlier systems such as the Apple II and Atari 800, with multi-color sprites and a more advanced sound processor.' },
      { id: 12, name: 'Amstrad CPC 464', photo: 'amstrad-cpc-464.jpg', likes: 6, desc: 'The Amstrad CPC (short for Colour Personal Computer) is a series of 8-bit home computers produced by Amstrad between 1984 and 1990. It was designed to compete in the mid-1980s home computer market dominated by the Commodore 64 and the Sinclair ZX Spectrum, where it successfully established itself primarily in the United Kingdom, France, Spain, and the German-speaking parts of Europe. The series spawned a total of six distinct models: The CPC464, CPC664, and CPC6128' },
      { id: 13, name: 'ZX81', photo: 'zx81.jpg', likes: 8, desc: 'The ZX81 is a home computer produced by Sinclair Research and manufactured in Scotland by Timex Corporation. It was launched in the United Kingdom in March 1981 as the successor to Sinclair\'s ZX80 and was designed to be a low-cost introduction to home computing for the general public. It was hugely successful, and more than 1.5 million units were sold before it was discontinued' },
      { id: 14, name: 'Amiga A500', photo: 'amiga-a500.jpg', likes: 15, desc: 'The Amiga 500, also known as the A500, is the first low-end Commodore Amiga 16/32-bit multimedia home/personal computer. It was announced at the winter Consumer Electronics Show in January 1987 – at the same time as the high-end Amiga 2000 – and competed directly against the Atari 520ST. The original Amiga 500 proved to be Commodore’s best-selling Amiga model, enjoying particular success in Europe. Although popular with hobbyists, arguably its most widespread use was as a gaming machine, where its advanced graphics and sound were of significant benefit. Amiga 500 eventually sold 6 million units worldwide.' },
      { id: 15, name: 'Atari 520ST', photo: 'atari-520st.jpg', likes: 2, desc: 'The Atari ST is a line of home computers from Atari Corporation and the successor to the Atari 8-bit family. The initial ST model, the 520ST, saw limited release in April-June 1985 and was widely available in July. The Atari ST is the first personal computer to come with a bitmapped color GUI, using a version of Digital Research\'s GEM released in February 1985. Thanks to its built-in MIDI ports, the ST enjoyed success for running music-sequencer software and as a controller of musical instruments among both amateurs & professional musicians.' },
      { id: 16, name: 'BBC Micro', photo: 'bbc-micro.jpg', likes: 5, desc: 'The BBC Microcomputer System, or BBC Micro, is a series of microcomputers and associated peripherals designed and built by the Acorn Computer company for the BBC Computer Literacy Project, operated by the British Broadcasting Corporation. Designed with an emphasis on education, it was notable for its ruggedness, expandability, and the quality of its operating system. An accompanying 1982 television series "The Computer Programme" featuring Chris Serle learning to use the machine was also broadcast on BBC 2.' },
      { id: 17, name: 'Commodore VIC-20', photo: 'vic-20.jpg', likes: 3, desc: 'The VIC-20 is an 8-bit home computer that was sold by Commodore Business Machines. The VIC-20 was announced in 1980, roughly three years after Commodore\'s first personal computer, the PET. The VIC-20 was the first computer of any description to sell one million units' },
      { id: 18, name: 'Dragon 32', photo: 'dragon-32.jpg', likes: 4, desc: 'The Dragon 32 and Dragon 64 are home computers that were built in the 1980s. The Dragons are very similar to the TRS-80 Color Computer, and were produced for the European market by Dragon Data, Ltd., in Port Talbot, Wales, and for the US market by Tano of New Orleans, Louisiana. The model numbers reflect the primary difference between the two machines, which have 32 and 64 kilobytes of RAM, respectively.' },
      { id: 19, name: 'Acorn Electron', photo: 'acorn-electron.jpg', likes: 1, desc: 'The Acorn Electron is a budget version of the BBC Micro educational/home computer made by Acorn Computers Ltd. It has 32 kilobytes of RAM, and its ROM includes BBC BASIC v2 along with its operating system. The Electron was able to save and load programs onto audio cassette via a supplied converter cable that connected it to any standard tape recorder that had the correct sockets. It was capable of basic graphics, and could display onto either a television set, a colour (RGB) monitor or a "green screen" monitor.' },
      { id: 20, name: 'SAM Coupé', photo: 'sam-coupe.jpg', likes: 2, desc: 'The SAM Coupé is an 8-bit British home computer that was first released in late 1989. It is commonly considered a clone of the Sinclair ZX Spectrum computer, since it features a compatible screen mode and emulated compatibility, and it was marketed as a logical upgrade from the Spectrum. The machine is based around a Z80B CPU clocked at 6 MHz and a 10,000-gate ASIC. The ASIC performs a similar role in the computer to the ULA in the ZX Spectrum.' }
];

// We need these set or it's impossible to continue
if(!process.env.APPSETTING_STORAGE_ACCOUNT || !process.env.APPSETTING_STORAGE_KEY) {
    console.log("### !ERROR! Missing env variables `APPSETTING_STORAGE_ACCOUNT` or `APPSETTING_STORAGE_KEY`. Exiting!");
    process.exit(1)
}

// Note APPSETTING_STORAGE_ACCOUNT and APPSETTING_STORAGE_KEY are required to be set
var tablesvc = azure.createTableService(process.env.APPSETTING_STORAGE_ACCOUNT, process.env.APPSETTING_STORAGE_KEY);

// GET - List all things
app.get('/things', function (req, res) {
   var query = new azure.TableQuery().where('PartitionKey eq ?', TABLE_PKEY);

   tablesvc.queryEntities(TABLE_NAME, query, null, function (error, result, response) {
      if (!error) {
         result.entries.map(thing => flattenObject(thing));
         res.type('application/json');
         res.send({ data: result.entries });
      }
   });
});

// GET - Single thing by id
app.get('/things/:id', function (req, res) {
   tablesvc.retrieveEntity(TABLE_NAME, TABLE_PKEY, req.params.id, function (error, result, response) {
      if (!error) {
         res.type('application/json');
         res.send({ data: flattenObject(result) });
      }
   });
});

// PUT - Update single thing by id
app.put('/things/:id', function (req, res) {
   var thing = req.body;
   thing.PartitionKey = TABLE_PKEY;
   tablesvc.replaceEntity(TABLE_NAME, thing, function (error, result, response) {
      if (!error) {
         res.type('application/json');
         res.send( {message: `Thing ${thing.RowKey} was deleted OK`} );
      }
   });
});

// POST - Create new thing 
app.post('/things', function (req, res) {
   var thing = req.body;
   thing.PartitionKey = TABLE_PKEY;

   var maxrowkey = 0;
   var query = new azure.TableQuery().where('PartitionKey eq ?', TABLE_PKEY);
   tablesvc.queryEntities(TABLE_NAME, query, null, function (error, result, response) {
      if (!error) {
         result.entries.sort((g1, g2) => g2.RowKey._ - g1.RowKey._);
         maxrowkey = result.entries[0].RowKey._;
         thing.RowKey = (parseInt(maxrowkey) + 1).toString();
         res.type('application/json');
         tablesvc.insertEntity(TABLE_NAME, thing, function (error, result, response) {
            if (!error) {
               res.status(200).send({ message: `Thing added to table OK, with RowKey ${thing.RowKey}`} );
            } else {
               res.status(500).send({ message: `Error creating thing: '${error.message}'` });
            }
         });
      } else {
         res.status(500).send(error.message)
      }
   });
});

// DELETE - Remove single thing by id
app.delete('/things/:id', function (req, res) {
    var thing = { PartitionKey: { '_': TABLE_PKEY }, RowKey: { '_': req.params.id } };
    tablesvc.deleteEntity(TABLE_NAME, thing, function (error, result, response) {
        res.type('application/json');
        if (!error) {
            res.status(200).send({ message: `Thing ${thing.RowKey._} was deleted OK` });
        } else {
            res.status(500).send({ message: `Error deleting thing: '${error.message}'` });
        }
    });
});

// GET - Init the database, wipe and reset data
app.get('/initdb', function (req, res) {
   tablesvc.deleteTableIfExists(TABLE_NAME, function (error, result, response) {
      if (!error) {
         console.log("### DB Init started. Table deleted, going to re-create it in 10secs... ");
         setTimeout(createTable, 10000);
      } else {
         console.error(error)
      }
   });
   res.type('application/json');
   res.status(200).send({ message:"Database init started. It should take ~40 seconds" })
});

// GET - Status check 
app.get('/status', function (req, res) {
   tablesvc.listTablesSegmented(null, function (error, result, response) {
      var message = {}

      message.APPSETTING_STORAGE_ACCOUNT = process.env.APPSETTING_STORAGE_ACCOUNT;
      message.APPSETTING_STORAGE_KEY_EXISTS = (process.env.APPSETTING_STORAGE_KEY.length > 0);
      message.TABLE_SVC_EXISTS = (tablesvc != null);

      if (!error) {
         message.TABLE_LIST = result.entries;
      } else {
         message.ERROR = "Error with storage account, could not list tables";
      }
      
      res.status(200).send(message);
   })

});

// GET - Search. Honestly this is junk, but Table Storage doesn't support wildcard/text querying  
app.get('/things/search/:q', function (req, res) {
   var query = new azure.TableQuery().where('PartitionKey eq ?', TABLE_PKEY);
   tablesvc.queryEntities(TABLE_NAME, query, null, function (error, result, response) {
      if (!error) {
         var srch_results = [];
         // Lets do a brute force full index string match search because we're idiots
         for(let r of result.entries) {
            if(r.name._.toString().toLowerCase().includes(req.params.q.toLowerCase())) {
               srch_results.push(flattenObject(r));
            }
         }
         res.type('application/json');
         res.send({ data: srch_results });
      }
   });
});

// Catch all
app.get('*',function (req, res) {
   res.send("Unknown API route!")
});

// Start the server
var port = process.env.PORT || 8080;
app.listen(port, function () {
   console.log(`### API listening on port ${port}`)
});

// Object flattener - moves sub-properties referenced by underscore
function flattenObject(obj) {
   for (prop in obj) {
      obj[prop] = obj[prop]._;
   }
   return obj;
}

// Called when running initdb
function createTable() {
   tablesvc.createTableIfNotExists(TABLE_NAME, function (error, result, response) {
      if (!error) {
         console.log("### Table (re)created! ");
         var batch = new azure.TableBatch();
         for (var g = 0; g < thing_data.length; g++) {
            var thing = {
               PartitionKey: { '_': TABLE_PKEY },
               RowKey: { '_': thing_data[g].id.toString() },
               name: { '_': thing_data[g].name },
               photo: { '_': thing_data[g].photo },
               likes: { '_': thing_data[g].likes },
               desc: { '_': thing_data[g].desc }
            };
            batch.insertOrReplaceEntity(thing, { echoContent: true });
         }
         tablesvc.executeBatch(TABLE_NAME, batch, function (error, result, response) {
            if (!error) {
               console.log("### Added fresh batch of things to table, DB init complete!")
            }
         });
      } else {
         if (error.statusCode == 409) {
            console.log("### Table still being deleted, will retry in 10sec... ");
            setTimeout(createTable, 10000);
         }
      }
   });
}