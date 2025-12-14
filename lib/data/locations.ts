// Indian States and Cities data for dropdown selectors

export const INDIAN_STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi",
    "Chandigarh",
    "Puducherry"
] as const;

export type IndianState = typeof INDIAN_STATES[number];

// Major cities by state
export const CITIES_BY_STATE: Record<string, string[]> = {
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati", "Kakinada", "Rajahmundry"],
    "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tawang"],
    "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia", "Arrah"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon"],
    "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Junagadh"],
    "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Rohtak", "Hisar", "Sonipat"],
    "Himachal Pradesh": ["Shimla", "Dharamshala", "Mandi", "Solan", "Kullu", "Manali", "Hamirpur"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh", "Deoghar"],
    "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubli", "Belgaum", "Gulbarga", "Shimoga", "Tumkur"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Kannur", "Palakkad"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar", "Rewa", "Satna"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Navi Mumbai"],
    "Manipur": ["Imphal", "Thoubal", "Bishnupur", "Churachandpur"],
    "Meghalaya": ["Shillong", "Tura", "Jowai", "Nongstoin"],
    "Mizoram": ["Aizawl", "Lunglei", "Champhai", "Serchhip"],
    "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri"],
    "Punjab": ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Alwar", "Bhilwara"],
    "Sikkim": ["Gangtok", "Namchi", "Mangan", "Gyalshing"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Vellore", "Erode"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Secunderabad"],
    "Tripura": ["Agartala", "Udaipur", "Dharmanagar", "Kailashahar"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Noida", "Ghaziabad", "Meerut", "Prayagraj", "Bareilly"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rishikesh", "Nainital"],
    "West Bengal": ["Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol", "Bardhaman", "Kharagpur"],
    "Delhi": ["New Delhi", "Delhi", "Dwarka", "Rohini", "Saket", "Janakpuri"],
    "Chandigarh": ["Chandigarh"],
    "Puducherry": ["Puducherry", "Karaikal", "Mahe", "Yanam"]
};

// Universities by state (starting with Alliance University in Karnataka)
// Will be expanded as more universities are added
export const UNIVERSITIES_BY_STATE: Record<string, string[]> = {
    "Karnataka": [
        "Alliance University",
        "Bengaluru University",
        "Christ University",
        "Jain University",
        "PES University",
        "RV University",
        "MS Ramaiah University",
        "Manipal Academy of Higher Education",
        "Visvesvaraya Technological University"
    ],
    "Maharashtra": [
        "University of Mumbai",
        "Savitribai Phule Pune University",
        "Symbiosis International University",
        "NMIMS University",
        "Amity University Mumbai"
    ],
    "Delhi": [
        "University of Delhi",
        "Jawaharlal Nehru University",
        "Jamia Millia Islamia",
        "Guru Gobind Singh Indraprastha University",
        "Amity University Noida"
    ],
    "Tamil Nadu": [
        "Anna University",
        "University of Madras",
        "SRM Institute of Science and Technology",
        "VIT University",
        "SASTRA University"
    ],
    "Telangana": [
        "University of Hyderabad",
        "Osmania University",
        "BITS Pilani Hyderabad",
        "IIIT Hyderabad",
        "Mahindra University"
    ],
    "Gujarat": [
        "Gujarat University",
        "Nirma University",
        "PDPU",
        "Ahmedabad University",
        "Ganpat University"
    ],
    "Uttar Pradesh": [
        "Banaras Hindu University",
        "Allahabad University",
        "Amity University",
        "Shiv Nadar University",
        "Bennett University"
    ],
    "West Bengal": [
        "University of Calcutta",
        "Jadavpur University",
        "Presidency University",
        "IIT Kharagpur",
        "St. Xavier's University"
    ],
    "Rajasthan": [
        "University of Rajasthan",
        "BITS Pilani",
        "Manipal University Jaipur",
        "JECRC University",
        "Amity University Jaipur"
    ],
    "Kerala": [
        "University of Kerala",
        "Cochin University",
        "Amrita University",
        "CUSAT",
        "Christ University Bengaluru"
    ],
    "Punjab": [
        "Panjab University",
        "Lovely Professional University",
        "Thapar Institute",
        "Chitkara University",
        "Guru Nanak Dev University"
    ],
    "Haryana": [
        "Ashoka University",
        "O.P. Jindal Global University",
        "Manav Rachna University",
        "SRM University Delhi-NCR",
        "Sharda University"
    ],
    // Add more states as universities are onboarded
    "_default": [] // For states without listed universities yet
};

// Get total university count
export const getTotalUniversitiesCount = (): number => {
    return Object.values(UNIVERSITIES_BY_STATE).reduce((total, unis) => total + unis.length, 0);
};

// Get universities for a state
export const getUniversitiesForState = (state: string): string[] => {
    return UNIVERSITIES_BY_STATE[state] || UNIVERSITIES_BY_STATE["_default"] || [];
};

// Get cities for a state
export const getCitiesForState = (state: string): string[] => {
    return CITIES_BY_STATE[state] || [];
};
