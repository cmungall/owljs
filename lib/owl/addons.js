importPackage(Packages.owltools.graph); 
importPackage(Packages.owltools.gaf); 
importPackage(Packages.owltools.gaf.lego); 

var response = require('ringo/jsgi/response');
var OWL = require("owl").OWL;
export('AddOns');

// - app: stick application
// - session: dict containing keys: owl, ...
function AddOns(app, session) {
    this.app = app;
    this.session = session;
    var owl = session.owl;

    // ROOT
    app.get('/test', function(request) {
        var info = {};
        return response.json({test:true});
    });

    // GAFFY STUFF
    // TODO - move this:

    session.gaf_dict = {};

    app.get('/load/gaf/:db', function(request, db) {
        var gob = new GafObjectsBuilder();
        var gaf = gob.buildDocument("gene-associations/gene_association."+db+".gz");
        session.gaf_dict[db] = gaf;
        console.log("GAF="+gaf);
        var dbs = [];
        for (var k in gaf_dict) {
            dbs.push(k);
        }
        return response.json({success: true,
                              dbs : dbs});
    });
    app.get('/unload/gaf/:db', function(request, db) {
        session.gaf_dict[db] = null;
        return response.json({success: true});
    });
    app.get('/lego/generate/:proc/:db', function(request, proc, db) {
        ni = new LegoModelGenerator(owl.getOntology());
        var ogw = new OWLGraphWrapper(owl.getOntology());
        ni.initialize(session.gaf_dict[db], ogw);
        console.log("Proc="+proc);
        ni.buildNetwork(proc, ni.getGenes(proc));
        
        return response.json({success: true});
    });

    // ROOT
    app.get('/', function(request) {
        var info = {};
        return response.json({hi:true});
    });

}
//exports.owlservices = OWLServices;

