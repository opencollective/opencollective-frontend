import subprocess

t1p = []
t2p = []
currentWorkingDirectory = "/Users/atharvchandratre/IdeaProjects/opencollective-frontend/"
for i in range(10):
  commandstr = "npx playwright test playwright-tests/16-tiers-page.spec.ts --reporter=json --workers=1 | grep duration"
  result = subprocess.run(commandstr.split(" "), capture_output=True, text=True, cwd=currentWorkingDirectory).stdout
  splitresult = result.split("\"duration\": ")
  t1p.append(int(splitresult[1].split(",")[0]))
  t2p.append(int(splitresult[2].split(",")[0]))

# t1 -> Test 1 of the spec file
# t2 -> Test 2 of the spec file
# c -> Cypress
# p -> Playwright

# t1c = [2486, 2116, 2156, 2017, 2018, 2106, 2060, 1899, 2108, 2283]
# t2c = [2018, 2120, 2037, 2031, 2135, 2074, 2292, 2225, 2141, 2031]
#
# t1p = [1483, 1402, 1395, 1426, 1570, 2019, 1873, 1443, 1516, 1438]
# t2p = [1356, 1416, 1344, 1356, 1662, 1852, 1434, 1388, 1485, 1460]
#
# print(sum(t1c)/10) = 2124.9
# print(sum(t2c)/10) = 2110.4
# print(sum(t1p)/10) = 1556.5
# print(sum(t2p)/10) = 1475.3
