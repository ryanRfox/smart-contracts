const algosdk = require('algosdk');
const fsp = require('fs').promises;
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const readline = require('readline');

// define the application to search for
const appID=13301402;

// define the algod connection
const algodToken = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const algodServer = "http://localhost";
const algodPort = 4001;

const version="// version";
const intcblock="intcblock";
const bytecblock="bytecblock";

let algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

// parses the approval program from the the application id provided. Returns the base64 program.
async function getApprovalProgram(id) {
    let response = await algodClient.getApplicationByID(id).do();
    let approvalProgram = JSON.stringify(response['params']['approval-program'], undefined, 2);
    console.log(approvalProgram);    
    return approvalProgram.slice(1, -1);
}

// writes a compiled binary file based on the base64 program.
async function writeBinary(programB64) {
    try {
        await fsp.writeFile(appID + '.teal.tok', programB64, 'base64');
        console.log("Wrote binary file: " + appID + ".teal.tok")
    }   catch (error) {
        console.log(error)
    }
}

// writes a source file with proper values. Reads the packed file and swaps values from packed arrays.
async function writeSource(ver, ints, bytes) {
    var source = "";
    var index = undefined;
    // read packed file line by line
    const fileStream = fs.createReadStream(appID + '.teal.pack');
  
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });  

    // swap packed values into source
    for await (const line of rl) {
        if (line.startsWith(version)) {
            source = source + "#pragma version " + ver[ver.length-1] + "\n"; 
        }
        else if (line.startsWith(intcblock) || line.startsWith(bytecblock)) {
            source = source + "// " + line + "\n";
        }
        else if (line.startsWith("intc")) {
            index = parseInt(line.slice(5), 10) + 1;
            source = source + "int " + ints[index] + "\n";
        }
        else if (line.startsWith("bytec")) { 
            index = parseInt(line.slice(6), 10) + 1;
            source = source + "byte \"" + hex2a(bytes[index]) + "\"\n";
        }
        else {
            source = source + line + "\n";
        }
    }
    // write source file
    try {
        await fsp.writeFile(appID + '.teal', source);
        console.log("Wrote source file: " + appID + ".teal")
    }   catch (error) {
        console.log(error)
    }
}

// calls goal to decompile the binary into the packed file. goal must be in $PATH
async function decompileBinary() {
    try {
        const { stdout, stderr } = await exec('goal clerk compile -D ' + appID + '.teal.tok > ' + appID + '.teal.pack');
        console.log("Wrote decompiled file: "  + appID + ".teal.pack");
    }catch (err) {
       console.error(err);
    };
};

// parses the packed file to find the requested data and returns an array.
async function parserFind(value) {
    const fileStream = fs.createReadStream(appID + '.teal.pack'); 
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });  
    for await (const line of rl) {
        if (line.startsWith(value)) {
            // console.log("Found %s", value)
            var parsedData = line.split(" ");
            // console.log(parsedData)
            fs.close;
            return parsedData;
        }
    }
}

// helper to convert hex to ascii
function hex2a(hex) {
    var str = '';
    for (var i = 0; i < hex.length; i += 2) {
        var v = parseInt(hex.substr(i, 2), 16);
        if (v) str += String.fromCharCode(v);
    }
    return str;
}  

 async function main() {
    // get approval program (base64)
    let approvalProgramB64 = await getApprovalProgram(appID);

    // write to binary file
    await writeBinary(approvalProgramB64);

    // decompile to packed source
    await decompileBinary();

    // parse the packed file
    const pragmaVersion = await parserFind(version);
    const intCBlock = await parserFind(intcblock);
    const byteCBlock = await parserFind(bytecblock);

    // write source file 
    writeSource(pragmaVersion, intCBlock, byteCBlock)

}

main();
