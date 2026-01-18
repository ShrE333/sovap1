
import { Course } from "../types";

export const owaspCourse: Course = {
    id: "owasp-top-10",
    title: "OWASP Top 10 Vulnerabilities",
    description: "Master the most critical web security risks with our adaptive AI engine.",
    modules: [
        {
            id: "m1",
            title: "Broken Access Control",
            topics: [
                {
                    id: "bac-1",
                    title: "Introduction to Access Control",
                    description: "Understanding how authorization works in web applications.",
                    content: "Access control enforces policy such that users cannot act outside of their intended permissions. Failure of access control can lead to unauthorized information disclosure, modification, or destruction of all data, or performing a business function outside of the user's limits.",
                    prerequisites: [],
                    estimatedTime: 15
                },
                {
                    id: "bac-2",
                    title: "IDOR Vulnerabilities",
                    description: "Insecure Direct Object References explained.",
                    content: "IDOR occurs when a web application uses an identifier for direct access to an object without checking authorization. For example, changing a URL from /api/user/100 to /api/user/101 and seeing another user's private data.",
                    prerequisites: ["bac-1"],
                    estimatedTime: 20
                }
            ],
            mcqs: [
                {
                    id: "mcq-1",
                    question: "What is the primary cause of IDOR vulnerabilities?",
                    options: [
                        "Lack of encryption",
                        "Missing authorization checks on server-side objects",
                        "Weak password hashing",
                        "Too many users in the system"
                    ],
                    correctIndex: 1,
                    difficulty: "basic",
                    explanation: "IDOR occurs when an application provides direct access to objects based on user-supplied input without performing an authorization check."
                }
            ]
        },
        {
            id: "m2",
            title: "Cryptographic Failures",
            topics: [
                {
                    id: "crypto-1",
                    title: "Data at Rest protection",
                    description: "How to safely store sensitive data.",
                    content: "Cryptographic failures often lead to sensitive data exposure or system compromise. Common mistakes include using insecure algorithms like MD5 or hardcoding keys.",
                    prerequisites: [],
                    estimatedTime: 25
                }
            ],
            mcqs: []
        },
        {
            id: "m3",
            title: "Injection",
            topics: [
                {
                    id: "inj-1",
                    title: "SQL Injection Fundamentals",
                    description: "The classic injection attack.",
                    content: "SQL Injection consists of insertion or 'injection' of a SQL query via the input data from the client to the application. Master parameterized queries to prevent this.",
                    prerequisites: ["bac-1"],
                    estimatedTime: 30
                }
            ],
            mcqs: []
        }
    ]
};
