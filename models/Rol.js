import mongoose from "mongoose";
const rolSchema = new mongoose.Schema({
    nombreRol : String
},{
    versionKey: false
});
const Rol = mongoose.model('Rol',rolSchema)
export default Rol;
