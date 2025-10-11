function grade(type, z) {
    if (type === 'monthly') {
        // Monthly grading logic

        if (z >= 23 && z <= 25) return "A+";
        else if (z >= 21 && z <= 22) return "A";
        else if (z >= 18 && z <= 20) return "B+";
        else if (z >= 16 && z <= 17) return "B";
        else if (z >= 13 && z <= 15) return "C+";
        else if (z >= 11 && z <= 12) return "C";
        else if (z >= 9 && z <= 10) return "D";
        else return "E";

    } else if (type === 'quarterly') {
        // Quarterly grading logic
        if (z >= 91 && z <= 100) return "A+";
        else if (z >= 81) return "A";
        else if (z >= 71) return "B+";
        else if (z >= 61) return "B";
        else if (z >= 51) return "C+";
        else if (z >= 41) return "C";
        else if (z >= 33) return "D";
        else return "E";
    }
}

export default { grade };