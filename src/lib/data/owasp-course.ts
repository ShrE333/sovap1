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
                    content: "Access control enforces policy such that users cannot act outside of their intended permissions...",
                    prerequisites: [],
                    estimatedTime: 15
                },
                {
                    id: "bac-2",
                    title: "IDOR Vulnerabilities",
                    description: "Insecure Direct Object References explained.",
                    content: "IDOR occurs when a web application uses an identifier for direct access to an object without checking authorization...",
                    prerequisites: ["bac-1"],
                    estimatedTime: 20
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
                    content: "Cryptographic failures often lead to sensitive data exposure or system compromise...",
                    prerequisites: [],
                    estimatedTime: 25
                }
            ]
        },
        {
            id: "m3",
            title: "Injection",
            topics: [
                {
                    id: "inj-1",
                    title: "SQL Injection Fundamentals",
                    description: "The classic injection attack.",
                    content: "SQL Injection consists of insertion or 'injection' of a SQL query via the input data from the client to the application...",
                    prerequisites: ["bac-1"], // Symbolic dependency
                    estimatedTime: 30
                }
            ]
        }
    ]
};
