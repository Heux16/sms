import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import pg from 'pg';
import passport from 'passport';
import session from 'express-session';
import { Strategy as LocalStrategy } from 'passport-local';
import grade from './public/js/grade.js';
import t_grade from './public/js/tgrade.js';
import intitializeTables from './public/models/tables.js';
dotenv.config(); 

const algorithm = "aes-256-gcm";
const key = process.env.ENCRYPTION_KEY; // store securely (e.g., in .env)
const app = express();
const PORT = process.env.PORT || 3000;
const saltRounds = 10;

app.set('view engine', 'ejs');
app.set('views', './views');


// Security and middleware configuration
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:true}));

// Security headers for production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Trust Render's proxy
  app.use((req, res, next) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
}

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 600 * 10 * 1000, // 100 minutes
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true, // Prevent XSS attacks
      sameSite: 'strict', // CSRF protection
    },
    name: 'sessionId', // Change default session name
  })
);

// Database configuration for production and development
const dbConfig = process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
} : {
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "mummy",
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
};

const db = new pg.Client(dbConfig);

// Enhanced connection with error handling
const connectDB = async () => {
  try {
    await db.connect();
    console.log('✅ Database connected successfully');
    await intitializeTables.initializeTables(db);
    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

connectDB();
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  if(req.isAuthenticated()){
    
    console.log("Authenticated user:", req.user);
    const role= req.user.role;
    if(role === 'admin'){
      res.redirect('/admin');
    }else if(role === 'teacher'){
      console.log("teacher logined")
      res.redirect('/teacher');
    }else if(role === 'student'){
      res.redirect('/student');
    }
  }else{
    res.render('login');
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err)
    }
    res.redirect("/");
  });
});

app.get('/admin', async (req, res) => {
  if(req.isAuthenticated() && req.user.role === 'admin'){
    const teachers = await db.query("SELECT * FROM users WHERE role='teacher'");
    const result = await db.query("SELECT * FROM users WHERE role='student'");
    const published_exam = await db.query("SELECT * FROM exams WHERE is_published = TRUE");
    res.render('admin/admin', { user: req.user , students: result.rows, teachers: teachers.rows, published_exams: published_exam.rows });
  }else{
    res.redirect('/');
  }
});

app.get('/admin/viewteachers', async (req, res) => {
  if(req.isAuthenticated() && req.user.role === 'admin'){
    try {
      const result = await db.query("SELECT * FROM users where role='teacher'");
      console.log(result.rows);
      res.render('admin/allTeachers', { teachers: result.rows, user: req.user });
    } catch (err) {
      console.error("Error fetching teachers:", err);
      res.status(500).send("Internal Server Error");
    }
  }else{
    res.redirect('/');
  }
});

app.get('/admin/addTeacher', (req, res) => {
  if(req.isAuthenticated() && (req.user.role === 'admin')){
    res.render('admin/addTeacher', { user: req.user });
  }else{
    res.redirect('/');
  }
});

app.post('/addTeacher', async (req, res) => {
  if(req.isAuthenticated() && (req.user.role === 'admin')){
    const { username, password} = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      await db.query("INSERT INTO users (username, password, role) VALUES ($1, $2, $3)", [username, hashedPassword, "teacher"]);
      res.redirect('/admin/viewTeachers');
    } catch (err) {
      console.error("Error adding teacher:", err);
      res.status(500).send("Internal Server Error");
    }
  }else{
    res.redirect('/');
  }
});



app.get('/admin/allStudents', async (req, res) => {
  if(req.isAuthenticated() && (req.user.role === 'admin' || req.user.role === 'teacher')){
    try {
      const result = await db.query("SELECT * FROM users where role='student'");
      console.log(result.rows);
      res.render('admin/allStudents', { students: result.rows, user: req.user });
    } catch (err) {
      console.error("Error fetching students:", err);
      res.status(500).send("Internal Server Error");
    }
  }else{
    res.redirect('/');
  }
});

app.get('/admin/viewExams', async (req, res) => {
  if(req.isAuthenticated() && req.user.role === 'admin'){
    try {
      const result = await db.query("SELECT * FROM exams");
    
      res.render('admin/allExams', { exams: result.rows, user: req.user });
    } catch (err) {
      console.error("Error fetching exams:", err);
      res.status(500).send("Internal Server Error");
    }
  }else{
    res.redirect('/');
  }
});

app.get('/admin/addExams', (req, res) => {
  if(req.isAuthenticated() && (req.user.role === 'admin')){
    res.render('admin/addExams', { user: req.user });
  }else{
    res.redirect('/');
  }
});

app.post('/addExams', async (req, res) => {
  if(req.isAuthenticated() && (req.user.role === 'admin')){
    const { exam_name, examClass, testtype, is_published } = req.body;
    try {
      await db.query("INSERT INTO exams (exam_name, class, testtype, is_published) VALUES ($1, $2, $3, $4)", [exam_name, examClass, testtype, is_published]);
      res.redirect('/admin/viewExams');
    } catch (err) {
      console.error("Error adding exam:", err);
      res.status(500).send("Internal Server Error");
    }
  }else{
    res.redirect('/');
  }
});

app.post('/admin/publish', async (req, res) => {
  if(req.isAuthenticated() && (req.user.role === 'admin')){
    const { id } = req.body;

    try {
      await db.query("UPDATE exams SET is_published = TRUE WHERE examid = $1", [id]);
      res.redirect('/admin/viewExams');
    } catch (err) {
      console.error("Error publishing exam:", err);
      res.status(500).send("Internal Server Error");
    }
  }else{
    res.redirect('/');
  }
});

app.get('/teacher', async (req, res) => {
  if(req.isAuthenticated() && req.user.role === 'teacher'){
    try {
  
      const result = await db.query("SELECT * FROM exams");
      console.log("Exams fetched:", result.rows);
      res.render('teacher/teacher', { user: req.user, exams: result.rows });
    } catch (error) {
      console.error("Error fetching exams:", error);
      res.status(500).send("Internal Server Error");
    }
      
  }else{
    res.redirect('/');
  }
});

app.get('/teacher/addstudents', (req, res) => {
  if(req.isAuthenticated() && (req.user.role === 'teacher')){
    res.render('teacher/addStudent', { user: req.user });
  }else{
    res.redirect('/');
  }
});

app.post('/addStudent', async (req, res) => {
  if(req.isAuthenticated() && (req.user.role === 'teacher')){
    const { username, rollNumber , clas, } = req.body;
    try {
      const randomString = crypto.randomBytes(2).toString('hex');
      const hashedPassword = await bcrypt.hash(username, saltRounds);

      await db.query("INSERT INTO users (username, password, role, rollNumber, class) VALUES ($1, $2, $3, $4, $5)", [username, hashedPassword, "student", rollNumber, clas]);
      res.redirect('/teacher/addstudents');
    } catch (err) {
      console.error("Error adding student:", err);
      res.status(500).send("Internal Server Error");
    }
  }else{
    res.redirect('/');
  }
});

app.get('/teacher/allStudents', async (req, res) => {
  if(req.isAuthenticated() && (req.user.role === 'admin' || req.user.role === 'teacher')){
    try {
      const result = await db.query("SELECT * FROM users where role='student'");

      res.render('admin/allStudents', { students: result.rows, user: req.user });
    } catch (err) {
      console.error("Error fetching students:", err);
      res.status(500).send("Internal Server Error");
    }
  }else{
    res.redirect('/');
  }
});


app.get("/teacher/addTest/:examId", async (req, res) => {
  if(req.isAuthenticated() && req.user.role === 'teacher'){
    const examId = req.params.examId;
    try {
      const result = await db.query("SELECT * FROM tests WHERE examid = $1", [examId]);
   
      const tests = await db.query("SELECT * FROM exams WHERE examid = $1", [examId]);
      const exam = result.rows;
      console.log("Rendering addTest with exam:", exam);
      res.render("teacher/addTest", { user: req.user, exam, tests: tests.rows });
    } catch (error) {
      console.error("Error fetching exam:", error);
      res.status(500).send("Internal Server Error");      
    }
  } else {
    res.redirect("/");
  }
});

app.post('/teacher/addTest', async (req, res) => {
  if(req.isAuthenticated() && (req.user.role === 'teacher')){
    const { examId, subject } = req.body;
    console.log("Received data for new test:", { examId, subject });
    try {
      await db.query("INSERT INTO tests (examid, subject) VALUES ($1, $2)", [examId, subject]);
      res.redirect(`/teacher/addTest/${examId}`);
    } catch (error) {
      console.error("Error adding test:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.redirect("/");
  }
});

app.get("/teacher/setMarks/:examId", async (req, res) => {
  if(req.isAuthenticated() && req.user.role === 'teacher'){
    const examId = req.params.examId;
    try {
      const result = await db.query("SELECT * FROM exams WHERE examid = $1", [examId]);
      const tests = await db.query("SELECT * FROM tests WHERE examid = $1", [examId]);
      const classes= result.rows[0].class;
     
      const students = await db.query("SELECT * FROM users WHERE role='student' AND class=$1", [classes]);
      
      // Fetch existing scores for all students in this exam
      const marks = await db.query(
        `SELECT ss.studentid, ss.testid, ss.score_theory, ss.score_practical, ss.total_score 
         FROM student_scores ss 
         INNER JOIN tests t ON ss.testid = t.testid 
         WHERE t.examid = $1`, 
        [examId]
      );
      
      // Create a map of scores by studentid and testid
      const scoresMap = {};
      marks.rows.forEach(mark => {
        if (!scoresMap[mark.studentid]) {
          scoresMap[mark.studentid] = {};
        }
        scoresMap[mark.studentid][mark.testid] = {
          score_theory: mark.score_theory,
          score_practical: mark.score_practical,
          total_score: mark.total_score
        };
      });
      
      // Attach scores to each student (will be populated when test is selected via JS)
      const studentsWithScores = students.rows.map(student => ({
        ...student,
        scoresMap: scoresMap[student.id] || {}
      }));
      
      console.log("Exam fetched for setting marks:", result.rows, "Tests:", tests.rows, "Students:", studentsWithScores);  
     
      if (result.rows.length > 0) {
        const exam = result.rows[0];
      
        res.render("teacher/setMarks", { user: req.user, exam, tests: tests.rows, students: studentsWithScores });
      } else {
        res.status(404).send("Exam not found");
      }
    } catch (error) {
      console.error("Error fetching exam:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.redirect("/");
  }
});

app.post('/teacher/setMarks', async (req, res) => {
  if(req.isAuthenticated() && (req.user.role === 'teacher')){
    const { examId, testId, scores } = req.body;
    try {
      const parsedTestId = parseInt(testId, 10);
      if (isNaN(parsedTestId) || parsedTestId <= 0) {
        console.warn('Invalid testId:', testId);
        return res.status(400).send('Invalid test selected');
      }
      console.log("Scores object:", scores);
      for (const studentId in scores) {
        if (scores.hasOwnProperty(studentId)) {
          const { score_theory, score_practical, rollnumber, username, id } = scores[studentId];
          const total_score = (parseInt(score_theory) || 0) + (parseInt(score_practical) || 0);
          console.log(`Inserting score for student ${id}: Theory=${score_theory}, Practical=${score_practical}, Total=${total_score}`);
          await db.query(
            `INSERT INTO student_scores (studentid, testid, score_theory, score_practical, total_score, graded_by) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, testId, score_theory || null, score_practical || null, total_score, req.user.id]
          );
        }
      }
      res.redirect(`/teacher/setMarks/${examId}`);
    } catch (error) {
      console.error("Error setting marks:", error);
      res.status(500).send("Internal Server Error");
    }
    console.log(req.body);
  } else {
    res.redirect("/");
  }
});

app.get('/student', (req, res) => {
  if(req.isAuthenticated() && req.user.role === 'student'){
    res.render('students/student', { user: req.user });
  }else{
    res.redirect('/');
  }
});

app.post("/login", 
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);


app.get('/privacy-policy', (req, res) => {
  res.render('pp');
});

app.get('/terms-of-service', (req, res) => {
  res.render('tos');
});

app.get('/support', (req, res) => {
  res.render('support');
});
app.get('/contact', (req, res) => {
  res.render('contact')
});

// Passport local strategy for authentication
passport.use("local",
  new LocalStrategy({
    usernameField: 'username', 
    passwordField: 'password'
  }, async function verify(username, password, cb) {
    console.log("Login attempt for:", username);
    try {
      const result = await db.query("SELECT * FROM users WHERE username = $1", [username]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        console.log("User found:", user.username);

        bcrypt.compare(password, user.password, (err, valid) => {
          if (err) {
            console.error("error comparing password", err);
            return cb(err);
          } else {
            console.log("Password match result:", valid)
            if (valid) { 
              console.log("Authentication successful"); 
              return cb(null, user);
            } else {
              console.log("Password incorrect"); 
              return cb(null, false);
            }
          }
        });
      } else {
        console.log("No user found with username:", username);
        return cb(null, false);
      }
    } catch (err) {
      console.log("Database error:", err);
      return cb(err);
    }
  })
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});
passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Enhanced server startup
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Local URL: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('💤 Process terminated');
    db.end();
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('💤 Process terminated');
    db.end();
  });
});