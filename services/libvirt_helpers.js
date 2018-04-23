const fs = require('fs');

String.prototype.allReplace = function(obj) {
    let retStr = this;
    for (let x in obj) {
        retStr = retStr.replace(new RegExp('{{' + x + '}}', 'g'), obj[x]);
    }
    return retStr;
};

function modelToXML(vm, baseXML, next){
    fs.readFile(baseXML, 'utf8', function(err, data) {
        if(err) next(err);
        let xml = data.allReplace(vm);
        next(null, xml);
    });
}

module.exports = {
    modelToXML
};