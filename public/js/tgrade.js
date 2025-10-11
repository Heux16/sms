 function t_grade(z) {
    if (z >= 541 && z <= 600) return "A+";
    else if (z >= 481) return "A";
    else if (z >= 421) return "B+";
    else if (z >= 361) return "B";
    else if (z >= 301) return "C+";
    else if (z >= 241) return "C";
    else if (z >= 199) return "D";
    else return "E";
  }

export default { t_grade };