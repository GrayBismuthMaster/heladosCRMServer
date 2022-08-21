import Rol from '../models/Rol.js';
const createRoles = async ()=>{
    try {
        const count = await Rol.estimatedDocumentCount();
        if(count >0) return;
        const values = await Promise.all([
            new Rol({nombreRol : "user"}).save(),
            new Rol({nombreRol : "admin"}).save(),
            // new Rol({nombreRol : "moderator"}).save() 
        ]);
        console.log(values);    
    } catch (error) {
        console.log(error);
    }
    
}
export default createRoles