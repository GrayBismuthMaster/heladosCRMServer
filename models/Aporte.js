import mongoose from 'mongoose'
const AportesSchema = mongoose.Schema({
    valor : {
        type:  Number,
        required : true
    },
    pedido :  {
        type : mongoose.Types.ObjectId,
        required : true,
        ref : "Pedido"
    },
   creado: {
       type:Date,
       default:Date.now()
   }
});
const Aporte = mongoose.model('Aporte', AportesSchema);
export default Aporte;