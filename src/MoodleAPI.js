export class MoodleClient {
    headersList = {
        "Accept": "*/*",
        "User-Agent": "Moodle Archiver"
    }
    constructor(username, backend) {
        this.username = username;
        this.userid = null;
        this.token = null;
        this.backend = backend.replace("/+$/g", '');
    }

    async getToken(password) {
        let bodyContent = new MoodleFormData();
        bodyContent.append("username", this.username);
        bodyContent.append("password", password);
        bodyContent.append("service", "moodle_mobile_app");
        let response = await fetch(
            `${this.backend}/login/token.php`,
            { method: "POST", body: bodyContent, headers: this.headersList }
        );
        let data = await response.json();
        if ("token" in data) {
            this.token = data["token"];
            return data["token"];
        }
        else if ("error" in data) {
            throw new Error(data["errorcode"])
        }
    }

    async getUserID() {
        if (this.token === null) {
            throw new Error("token not recieved yet");
        }
        if (this.userid === null) {
            let bodyContent = new MoodleFormData();
            bodyContent.append("wstoken", this.token);
            bodyContent.append("wsfunction", "core_webservice_get_site_info");

            let response = await fetch("https://lms.ssn.edu.in/webservice/rest/server.php", {
                method: "POST",
                body: bodyContent,
                headers: this.headersList
            });

            let data = await response.json();
            if ("errorcode" in data) {
                throw new Error(data["errorcode"])
            }
            this.userid = data["userid"]
            return this.userid;
        }
        else {
            return this.userid
        }
    }

    async getUserCourses() {
        if (this.token === null) {
            throw new Error("token not recieved yet");
        }
        if (this.userid === null) {
            throw new Error("userID not receieved yet")
        }

        let bodyContent = new FormData();
        bodyContent.append("wstoken", this.token);
        bodyContent.append("wsfunction", "core_enrol_get_users_courses");
        bodyContent.append("moodlewsrestformat", "json");
        bodyContent.append("userid", this.userid);

        let response = await fetch("https://lms.ssn.edu.in/webservice/rest/server.php", {
            method: "POST",
            body: bodyContent,
            headers: this.headersList
        });

        let data = await response.json();
        if ("errorcode" in data) {
            throw new Error(data["errorcode"])
        }
        var courses = []
        for (let courseinfo of data) {
            courses.push({ "id": courseinfo["id"], "shortname": courseinfo["shortname"] })
        }
        return courses;
    }
}

class MoodleFormData extends FormData {
    constructor(args) {
        super(args);
        this.append("moodlewsrestformat", "json")
    }
}