# Delete all files deleted by us when git merging from master to production
# Linux:
git diff --name-only --diff-filter=U | xargs git rm
# Windows(PowerShell): Create xargs in PowerShell
filter xargs { & $args[0] ($args[1..$args.length] + $_) }
# followed by the actual command
git diff --name-only --diff-filter=U | xargs git rm

# git pull, merge master from master branch all in one go
git checkout production && git pull origin master && git diff --name-only --diff-filter=U | xargs git rm