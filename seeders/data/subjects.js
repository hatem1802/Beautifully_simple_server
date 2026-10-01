const subjects = [
  {
    name: "HTML Fundamentals",
    description: "Learn the building blocks of every web page.",
    price: 150,
    durationDays: 60,
    lectures: [
      {
        title: "Introduction to HTML",
        order: 1,
        files: [
          {
            name: "html-intro.pdf",
            url: "/uploads/seed/html-intro.pdf",
            order: 1,
            size: 102400,
          },
        ],
        quiz: {
          questions: [
            {
              question: "What does HTML stand for?",
              options: [
                "Hyper Text Markup Language",
                "High Tech Modern Language",
                "Home Tool Markup Language",
                "Hyperlinks and Text Markup Language",
              ],
              correctAnswer: "Hyper Text Markup Language",
              duration: 30,
            },
          ],
        },
      },
      {
        title: "HTML Elements & Tags",
        order: 2,
        files: [
          {
            name: "html-tags.pdf",
            url: "/uploads/seed/html-tags.pdf",
            order: 1,
            size: 204800,
          },
        ],
        quiz: {
          questions: [
            {
              question: "Which tag is used for the largest heading?",
              options: ["<h6>", "<h1>", "<heading>", "<head>"],
              correctAnswer: "<h1>",
              duration: 30,
            },
          ],
        },
      },
    ],
    finalQuiz: {
      questions: [
        {
          question: "Which tag creates a hyperlink?",
          options: ["<link>", "<a>", "<href>", "<url>"],
          correctAnswer: "<a>",
          duration: 45,
        },
        {
          question: "Which attribute sets an image's alternative text?",
          options: ["title", "src", "alt", "name"],
          correctAnswer: "alt",
          duration: 45,
        },
      ],
    },
  },
  {
    name: "CSS Styling",
    description: "Style and lay out web pages with CSS.",
    price: 200,
    durationDays: 60,
    lectures: [
      {
        title: "CSS Selectors",
        order: 1,
        files: [
          {
            name: "css-selectors.pdf",
            url: "/uploads/seed/css-selectors.pdf",
            order: 1,
            size: 153600,
          },
        ],
        quiz: {
          questions: [
            {
              question: "Which symbol selects an element by class?",
              options: ["#", ".", "*", ">"],
              correctAnswer: ".",
              duration: 30,
            },
          ],
        },
      },
      {
        title: "Flexbox & Grid",
        order: 2,
        files: [
          {
            name: "flexbox-grid.pdf",
            url: "/uploads/seed/flexbox-grid.pdf",
            order: 1,
            size: 256000,
          },
        ],
        quiz: null,
      },
    ],
    finalQuiz: {
      questions: [
        {
          question: "Which property turns an element into a flex container?",
          options: ["display: flex", "flex: 1", "position: flex", "float: flex"],
          correctAnswer: "display: flex",
          duration: 45,
        },
      ],
    },
  },
  {
    name: "JavaScript Basics",
    description: "Start programming the web with JavaScript.",
    price: 250,
    durationDays: 90,
    lectures: [
      {
        title: "Variables & Data Types",
        order: 1,
        files: [
          {
            name: "js-variables.pdf",
            url: "/uploads/seed/js-variables.pdf",
            order: 1,
            size: 180000,
          },
        ],
        quiz: {
          questions: [
            {
              question: "Which keyword declares a block-scoped variable?",
              options: ["var", "let", "function", "constantly"],
              correctAnswer: "let",
              duration: 30,
            },
            {
              question: "What is the result of typeof null?",
              options: ['"null"', '"undefined"', '"object"', '"number"'],
              correctAnswer: '"object"',
              duration: 30,
            },
          ],
        },
      },
    ],
    finalQuiz: null,
  },
];

export { subjects };
