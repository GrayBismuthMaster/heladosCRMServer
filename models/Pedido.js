import mongoose from 'mongoose'
const PedidosSchema = mongoose.Schema({
   pedido: {
       type: Array,
       required:true
   },
   total: {
       type:Number,
       required: true
   },
   cliente: {
       type: mongoose.Schema.Types.ObjectId,
       required:true,
       ref:'Cliente'
   },
   vendedor: {
       type:mongoose.Schema.Types.ObjectId,
       required:true,
       ref:'Usuario'
   },
   aportes : [{
        type : mongoose.Schema.Types.ObjectId,
        required : false,
        ref: 'Aporte'
   }],
   saldo : {
        type: Number,
        required : false
   },
   estado: {
       type:String,
       default: "PENDIENTE"
   },
   creado: {
       type:Date,
       default:Date.now()
   }
});
const Pedido = mongoose.model('Pedido', PedidosSchema);
export default Pedido;