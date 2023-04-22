import com.mwam.jenkins.build.GitopsBuild
import com.mwam.jenkins.helpers.*

publishBranches = ["master"]

library_init()
GitVersion.setShouldPublish(publishBranches)

def npm = new GitopsBuild()
def agent = new BuildAgent()
    .addGitversionContainer()
    .addContainers(npm.getBuildContainer())

agent._podSpec["spec"]["volumes"].add([
    "name": "chrome-plugin-private-key",
    "secret": ["secretName": "chrome-plugin-private-key"]
])

agent._podSpec["spec"]["containers"].find { c -> c.name == "gitops" }["volumeMounts"] = [[
    "mountPath": "/tmp/plugin/",
    "name": "chrome-plugin-private-key"
]]

agent.RunInAgent {
  stage("setup") {
    container("gitversion") {
      sh "/tools/dotnet-gitversion > gitversion.json"
    }

    container("gitops") {
      sh "npm config set strict-ssl false"
      sh "npm install"
    }
  }

  stage("build") {
    container("gitops") {
      sh "npm run build"
    }
  }
 
  if (Publish.instance.shouldPublish) {
    stage('publish') {
      container('gitops') {
        withCredentials([usernamePassword(
              credentialsId: OpenShiftEnv.getJenkinsSecret('Artifactory'),
              usernameVariable: "artUser",
              passwordVariable: "artPass")]) {
          sh(label: 'Publish - push', script: """
            cd buildArtifacts && find . -name *.crx -type f -exec \
            curl -X PUT -H "X-Requested-With: XMLHttpRequest" -u ${artUser}:${artPass} -T {} "https://artifactory.mwam.local/artifactory/generic-corelib-local/MWScreenshotSharing/{}" \;
          """)
        }
      }
    }
  }
}
