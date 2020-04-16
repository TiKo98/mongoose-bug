const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;




// bug start
const mongoose = require('mongoose');
const { Schema } = mongoose;

const testSchema = new Schema({
  field: { type: String, set: v => { console.log('set field'); return v }}
})

testSchema.virtual('virtual').set(v => {
  console.log('set virtual');
  return v;
});

const Test = mongoose.model('test', testSchema);

const worksWell = new Test({
  field: "Hello World",
  virtual: "It's me."
})
worksWell.save();


const server = http.createServer( async (req, res) => {
  await Test.findOneAndUpdate({field: "Hello World"}, {field: "Invokes setter", virtual: "Won't invoke setter"});


  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});



// bug end

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});