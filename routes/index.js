var express = require('express');
var multer = require('multer');
var path = require('path');
var jwt = require('jsonwebtoken');
var empModel = require('../modules/employee');
var uploadModel = require('../modules/upload');

var router = express.Router();

router.use(express.static(__dirname+"./public/"));

var employee =empModel.find({});
var imageData =uploadModel.find({});


//requiring localstorage when (checks for any previous allocation to local-storage whether exist or not,if not it is created,using node-localstorage package)
if (typeof localStorage === "undefined" || localStorage === null) {
  const LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');//creation of new(./scratch folder which stores credentials in hashed form) local storage
}

var Storage= multer.diskStorage({
  destination:"./public/uploads/",
  filename:(req,file,cb)=>{
    cb(null,file.fieldname+"_"+Date.now()+path.extname(file.originalname));
  }
});

var upload = multer({
  storage:Storage
}).single('file');


/* GET home page. */
router.post('/upload', upload,function(req, res, next) {
  var imageFile=req.file.filename;
 var success =req.file.filename+ " uploaded successfully";

 var imageDetails= new uploadModel({
  imagename:imageFile
 });
 imageDetails.save(function(err,doc){
if(err) throw err;

imageData.exec(function(err,data){
if(err) throw err;
res.render('upload-file', { title: 'Upload File', records:data, success:success});
});

 });

  });

 //Checking login credentials
  function checkLogin(req,res,next){
    var myToken= localStorage.getItem('myToken');//getting credential from localstorage
    try {
     jwt.verify(myToken, 'loginToken');
    } catch(err) {
      res.send ("you need login to access this page");
    }
    next();//passing control to next mthod
  }

router.get('/upload', checkLogin ,function(req, res, next) {
  imageData.exec(function(err,data){
    if(err) throw err;
res.render('upload-file', { title: 'Upload File', records:data, success:''});
  });
});


// checking login status for viewing home page using checkLogin middleware
router.get('/',checkLogin,function(req, res, next) {
  employee.exec(function(err,data){
if(err) throw err;
res.render('index', { title: 'Employee Records', records:data, success:'' });
  });
  
});
router.get('/login',function(req, res, next) {

  //generating static(stateless authentication) web(taking data through form i.e. is the dynamic way of generating token) token by HMAC SHA256 mthod (one more method in jsonwebtoken i.e. RSA SHA256)

  var token = jwt.sign({ username: 'anjali' }, 'loginToken');//login credentials(username:"aman") is stored inside loginToken
  localStorage.setItem('myToken', token);//storing token
  res.send("Login Successfully");//this mess displayed on frontend by using urllocalhost:3000/login,nothing to do with html code right now
});

router.get('/logout',function(req, res, next) {

  localStorage.removeItem('myToken');//removing token from localstorage assigned while logging out
  res.send("Logout Successfully");
  
});



router.post('/', upload, function(req, res, next) {
  if(req.file){
  var empDetails = new empModel({
    name: req.body.uname,
    email: req.body.email,
    etype: req.body.emptype,
    hourlyrate: req.body.hrlyrate,
    totalHour: req.body.ttlhr,
    total: parseInt(req.body.hrlyrate) * parseInt(req.body.ttlhr),
    image:req.file.filename,
  });
}else{

  alert('Upload Image');
 
}

  empDetails.save(function(err,req1){
    if(err) throw err;
    employee.exec(function(err,data){
      if(err) throw err;
      res.render('index', { title: 'Employee Records', records:data, success:'Record Inserted Successfully' });
        });
  })
  
  
});

router.post('/search/',upload, function(req, res, next) {

  var flrtName = req.body.fltrname;
  var flrtEmail = req.body.fltremail;
  var fltremptype = req.body.fltremptype;
  
  if(flrtName !='' && flrtEmail !='' && fltremptype !='' ){

   var flterParameter={ $and:[{ name:flrtName},
  {$and:[{email:flrtEmail},{etype:fltremptype}]}
  ]
   }
  }else if(flrtName !='' && flrtEmail =='' && fltremptype !=''){
    var flterParameter={ $and:[{ name:flrtName},{etype:fltremptype}]
       }
  }else if(flrtName =='' && flrtEmail !='' && fltremptype !=''){

    var flterParameter={ $and:[{ email:flrtEmail},{etype:fltremptype}]
       }
  }else if(flrtName =='' && flrtEmail =='' && fltremptype !=''){

    var flterParameter={etype:fltremptype
       }
  }else{
    var flterParameter={}
  }
  var employeeFilter =empModel.find(flterParameter);
  employeeFilter.exec(function(err,data){
    console.log(data);
      if(err) throw err;
      res.render('index', { title: 'Employee Records', records:data, success:'Sorted Data Shown'});
        });
  
  
});

router.get('/delete/:id', function(req, res, next) {
var id=req.params.id;
var del= empModel.findByIdAndDelete(id);

del.exec(function(err){//execution of deletion
if(err) throw err;
employee.exec(function(err,data){
  if(err) throw err;
  res.render('index', { title: 'Employee Records', records:data, success:'Record Deleted Successfully' });
    });
  });
  
});

router.get('/edit/:id', function(req, res, next) {
  var id=req.params.id;
var edit= empModel.findById(id);
edit.exec(function(err,data){//execution of edition
if(err) throw err;
res.render('edit', { title: 'Edit Employee Record', records:data });
  });
  
});

router.post('/update/', upload,function(req, res, next) {
 
  if(req.file){

var dataRecords={
  name: req.body.uname,
    email: req.body.email,
    etype: req.body.emptype,
    hourlyrate: req.body.hrlyrate,
    totalHour: req.body.ttlhr,
    total: parseInt(req.body.hrlyrate) * parseInt(req.body.ttlhr),
    image:req.file.filename,
}
  }else{

    var dataRecords={
      name: req.body.uname,
        email: req.body.email,
        etype: req.body.emptype,
        hourlyrate: req.body.hrlyrate,
        totalHour: req.body.ttlhr,
        total: parseInt(req.body.hrlyrate) * parseInt(req.body.ttlhr),
      
    }
  }


var update= empModel.findByIdAndUpdate(req.body.id,dataRecords);
update.exec(function(err,data){
if(err) throw err;
employee.exec(function(err,data){
  if(err) throw err;
  res.redirect("/");  });
  });
  
});

//autocomplete functionality
router.get('/autocomplete/', function(req, res, next) {

  var regex= new RegExp(req.query["term"],'i');//received req as a,ab,..etc,i does the work of flags, our query is stored inside regex variable
 
  var employeeFilter =empModel.find({name:regex},{'name':1}).sort({"updated_at":-1}).sort({"created_at":-1}).limit(20);//20 options showed at once out of all data
  employeeFilter.exec(function(err,data){//on execution the resquired data comes inside data varible


var result=[];
if(!err){
   if(data && data.length && data.length>0){
     data.forEach(user=>{ //data is an array here in which we get all our data of query
       let obj={
         id:user._id,
         label: user.name
       };
       result.push(obj);
     });

   }
 
   res.jsonp(result);
}

  });

});


module.exports = router;
