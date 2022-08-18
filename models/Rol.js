const mongoose = require('mongoose');
const rolSchema = new mongoose.Schema({
    nombreRol : String
},{
    versionKey: false
});

module.exports = mongoose.model('Rol',rolSchema)