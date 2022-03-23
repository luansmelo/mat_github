import fs from 'fs'
import csv from "csv-parser"
import { Octokit } from "octokit";

function loadCsvData(filename) {
    return new Promise(function (resolve) {
        const results = [];

        fs.createReadStream(filename)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results));
    })
}

(async () => {
    const studentsClass = process.argv[2]
    const shift = process.argv[3]
    const octokit = new Octokit({ auth: `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` });

    /** @type {{ nome: string; nome_aluno: string }[]} */
    const students = await loadCsvData('data.csv');

    for (const student of students) {
        const repoName = `${studentsClass}-${student.nome_aluno}`

        // Cria o repositório
        const repo = await octokit.rest.repos.createUsingTemplate({
            // Template a ser usado
            template_owner: "futureorganization",
            template_repo: shift === "integral" ? "integral" : "noturno",

            // Repositório target
            owner: "futureorganization",
            name: repoName,

            // Config da criação
            include_all_branches: true,

            // Descrição do repositório
            description: `Repositório do(a) ${student.nome_aluno}. Participante da turma ${studentsClass}`,
        });

        await octokit.rest.repos.replaceAllTopics({
            // Repositório target
            owner: "futureorganization",
            repo: repoName,

            names: [
                'student',
                studentsClass.toLowerCase(),
                student.nome,
                student.nome_aluno.toLowerCase()
            ],
        });

        await octokit.rest.repos.update(
            {
                // Repositório target
                owner: "futureorganization",
                repo: repoName,

                // Adiciona o URL para o labenu
                homepage: "https://labenu.com.br",

                // Disabilita algumas coisas
                has_wiki: false,
                has_issues: false,
                // allow_forking: false,
                has_projects: false,

                // Somente o squash and merge
                allow_merge_commit: false,
                allow_rebase_merge: false,
            }
        );

        await octokit.rest.repos.addCollaborator({
            // Repositório target
            owner: "futureorganization",
            repo: repoName,

            // Usuário a ser adicionado
            username: student.nome,

            // https://docs.github.com/en/organizations/managing-access-to-your-organizations-repositories/repository-roles-for-an-organization#permissions-for-each-role
            permission: "push",
        });

        console.log(`${student.nome_aluno}: Repositório ${repo.data.html_url} criado.`)
    }
})().catch(console.error);
