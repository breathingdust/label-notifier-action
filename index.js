const core = require('@actions/core');
const { Octokit } = require('@octokit/action');
const github = require('@actions/github');

const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');

async function addComment(issueNumber, message, label, recipient) {
  const body = message.replace('{recipient}', recipient).replace('{label}', label);
  const octokit = new Octokit();
  try {
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body,
    });
  } catch (error) {
    core.setFailed(`Error creating comment on issue ${issueNumber}: ${error}`);
    return false;
  }
  return true;
}

async function main() {
  const issueNumber = github.context.payload.issue.number;
  const message = core.getInput('message');
  const labelRecipients = core.getInput('label-recipients').trim().split('\n');
  const label = github.context.payload.label.name;

  core.info(`Starting job for ${owner} ${repo}. Issue:${issueNumber} Label: ${label}`);

  for (let index = 0; index < labelRecipients.length; index += 1) {
    core.info(`${labelRecipients[index]}`);
  }

  const comments = [];
  for (let i = 0; i < labelRecipients.length; i += 1) {
    const recipientConfig = labelRecipients[i].trim().split('=');
    if (recipientConfig[0].trim() === label.trim()) {
      core.info(`Found label:${label} with recipient:${recipientConfig[1]} configured for issue ${issueNumber}`);
      comments.push(addComment(issueNumber, message, label, recipientConfig[1].trim()));
    } else {
      core.info(`No recipient found for label:${recipientConfig[0]} on issue ${issueNumber}`);
    }
  }
  await Promise.all(comments);
}

try {
  main();
} catch (error) {
  core.setFailed(error);
}
