import com.mwam.jenkins.build.GitopsBuild
import com.mwam.jenkins.helpers.*

def artifactoryPath = "/artifactory/generic-corelib-local/MWScreenshotSharing/"
publishBranches = ["master"]

library_init()
GitVersion.setShouldPublish(publishBranches)

def npm = new GitopsBuild(artifactoryPath)
def agent = new BuildAgent()
    .addGitversionContainer()
    .addContainers(npm.getBuildContainer())

agent._podSpec["spec"]["volumes"].add([
    "name": "chrome-plugin-private-key",
    "secret": ["secretName": "chrome-plugin-private-key"]
])

agent._podSpec["spec"]["containers"].find { c -> c.name == "npm" }["volumeMounts"] = [[
    "mountPath": "/tmp/plugin/",
    "name": "chrome-plugin-private-key"
]]

agent.RunInAgent {
  Script steps = ContextRegistry.getScript()

  steps.stage("setup") {
    steps.container("gitversion") {
      steps.sh "gitversion > gitversion.yaml"
    }

    steps.container("npm") {
      steps.sh "npm install"
    }
  }

  steps.stage("build") {
    steps.container("npm") {
      steps.sh "npm run build"
    }
  }
 
  if (Publish.instance.shouldPublish) {
    steps.stage('publish') {
      steps.container('npm') {
        steps.withCredentials([steps.usernamePassword(
              credentialsId: this.OsEnv.getJenkinsSecret('Artifactory'),
              usernameVariable: "artUser",
              passwordVariable: "artPass")]) {
          steps.sh(label: 'Publish - push', script: """
            cd buildArtifacts && find . -name *.crx -type f -exec \
            curl -X PUT -H "X-Requested-With: XMLHttpRequest" -u ${steps.artUser}:${steps.artPass} -T {} "https://artifactory.mwam.local/artifactory/generic-corelib-local/MWScreenshotSharing/{}" ;
          """)
        }
      }
    }
  }
}
