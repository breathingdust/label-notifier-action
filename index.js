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
  core.info(`Starting job for ${owner} ${repo}.`);
  // const issueNumber = github.context.payload.issue.number;
  // const message = core.getInput('message');
  // const labelRecipients = core.getInput('label_recipients').split('\n');
  // const label = github.context.payload.label.name;

  const issueNumber = github.context.payload.issue.number;
  const message = core.getInput('message');
  const labelRecipients = core.getInput('label_recipients').split('\n');
  const label = github.context.payload.label.name;

  for (let i = 0; i < labelRecipients.length; i += 1) {
    const recipientConfig = labelRecipients.split('=');
    if (recipientConfig[0] === label) {
      core.info(`Found label:${label} with recipient:${recipientConfig[1]} configured for issue ${issueNumber}`);
      addComment(issueNumber, message, recipientConfig[1]);
    } else {
      core.info(`No recipient found for label:${label} on issue ${issueNumber}`);
    }
  }
}

try {
  main();
} catch (error) {
  core.setFailed(error);
}
