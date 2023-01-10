#!/bin/bash

# get MajorMinorPatch from gitversion.json 
MajorMinorPatch=`node -pe 'JSON.parse(process.argv[1]).MajorMinorPatch' "$(cat gitversion.json)"`
SemVer=`node -pe 'JSON.parse(process.argv[1]).SemVer' "$(cat gitversion.json)"`
CrxFile=MWScreenshotSharing-v${SemVer}.crx
CrxKey=/tmp/plugin/crxkey
SrcFolder=src
ExtensionId=jiiphahkgkejfheajligilpmgijkchba
ArtifactsFolder=buildArtifacts

echo "SDDT build.sh:"
echo "MajorMinorPatch=${MajorMinorPatch}"
echo "SemVer=${SemVer}"
echo "CrxFile=${CrxFile}"
echo "CrxKey=${CrxKey}"
echo "SrcFolder=${SrcFolder}"
echo "ExtensionId=${ExtensionId}"
echo "ArtifactsFolder=${ArtifactsFolder}"

echo "working directory:"
pwd

echo "secrets in /tmp/MWScreenshotSharing:"
ls -la /tmp/plugin

if [ ! -f "$CrxKey" ]; then
    echo "${CrxKey} doesn't exist, cannot build crx file."
    exit 1
fi

if [ ! -r "$CrxKey" ]; then
    echo "${CrxKey} exist but it's not readable."
    exit 2
fi

echo create a symlink from the secret to local key.pem file so build will pick it up
ln -s ${CrxKey} $(pwd)/key.pem

echo "set version field in package.json"
npm version ${MajorMinorPatch} --no-git-tag-version --allow-same-version

echo "build plugin"
sed -i "s/{MajorMinorPatch}/${MajorMinorPatch}/g" src/manifest.json
node node_modules/crx3/bin/crx3 --key ${CrxKey} --crx ${CrxFile} ${SrcFolder}

echo "prepare manifest.xml:"
mkdir --verbose -p ${ArtifactsFolder}
cp --verbose manifest.xml ${ArtifactsFolder}
sed -i "s/{ExtensionId}/${ExtensionId}/g" ${ArtifactsFolder}/manifest.xml
sed -i "s/{CrxFile}/${CrxFile}/g" ${ArtifactsFolder}/manifest.xml
sed -i "s/{MajorMinorPatch}/${MajorMinorPatch}/g" ${ArtifactsFolder}/manifest.xml

echo "moving build artifacts to ${ArtifactsFolder}"
mkdir --verbose -p ${ArtifactsFolder}
mv --verbose ${CrxFile} ${ArtifactsFolder}

echo "build.sh: finished"
