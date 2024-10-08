const fs = require("fs").promises;
const path = require("path");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const { format } = require("date-fns");
const term = require("terminal-kit").terminal;

async function checkBackupSettings() {
  const enableBackups = process.env.ENABLE_BACKUPS === "true";
  const backupLocation = process.env.BACKUP_LOCATION;

  if (!enableBackups) {
    term.red(
      "Backups are disabled. Set ENABLE_BACKUPS=true in .env to enable.\n"
    );
    return;
  }

  if (!backupLocation) {
    term.yellow("Backup location not set. Please select a backup location:\n");
    await selectBackupLocation();
  } else {
    term.green(`Backups enabled. Backup location: ${backupLocation}\n`);
    scheduleBackups(backupLocation);
  }
}

async function selectBackupLocation() {
  const items = [
    "Enter a custom path",
    "Select a USB drive",
    "Disable backups",
  ];

  const menuOptions = {
    selectedStyle: term.bgGray,
    cancelable: true,
    exitOnUnexpectedKey: false,
  };

  try {
    const response = await term.singleColumnMenu(items, menuOptions).promise;
    term.clear(); // Clear the screen after selection

    if (response.selectedIndex === 0) {
      const customPath = await term.inputField({
        prompt: "Enter the backup path: ",
        cancelable: true,
        keyBindings: { CTRL_C: "cancel" },
      }).promise;
      term.clear(); // Clear the screen after input
      if (await pathExists(customPath)) {
        await updateEnvFile("BACKUP_LOCATION", customPath);
        scheduleBackups(customPath);
      } else {
        term.red("Invalid path. Please try again.\n");
        await selectBackupLocation();
      }
    } else if (response.selectedIndex === 1) {
      const drives = await listUsbDrives();
      if (drives.length === 0) {
        term.red(
          "No USB drives found. Please connect a USB drive and try again.\n"
        );
        await selectBackupLocation();
      } else {
        term.green("Select a USB drive:\n");
        const driveOptions = drives.map(
          (drive) => `${drive.name} (${drive.size} GB) - ${drive.path}`
        );
        const driveResponse = await term.singleColumnMenu(
          driveOptions,
          menuOptions
        ).promise;
        term.clear(); // Clear the screen after USB drive selection
        const selectedDrive = drives[driveResponse.selectedIndex];
        await updateEnvFile("BACKUP_LOCATION", selectedDrive.path);
        scheduleBackups(selectedDrive.path);
      }
    } else if (response.selectedIndex === 2) {
      term.yellow("Disabling backups\n");
      await updateEnvFile("ENABLE_BACKUPS", "false");
      term.green("Backups disabled\n");
    }
  } catch (error) {
    if (error.message === "Canceled") {
      term.yellow("\nOperation canceled.\n");
      term.processExit(0);
    } else {
      throw error;
    }
  }
}

async function listUsbDrives() {
  try {
    if (process.platform === "win32") {
      const { stdout } = await execPromise(
        "wmic logicaldisk where drivetype=2 get deviceid, volumename, size, description /format:csv"
      );
      const lines = stdout.trim().split("\n").slice(1);
      return lines.map((line) => {
        const [, deviceId, volumeName, size, description] = line.split(",");
        return {
          name: volumeName.trim() || description.trim(),
          size: (parseInt(size) / (1024 * 1024 * 1024)).toFixed(2),
          path: volumeName.trim() + "/", // This will be "D:/" for example
        };
      });
    } else {
      const { stdout } = await execPromise(
        'lsblk -nlo NAME,TRAN,SIZE,MOUNTPOINT | grep "usb"'
      );
      return stdout
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const [name, , size, mountpoint] = line.split(/\s+/);
          return {
            name: `${name} (USB Device)`,
            size: size.replace("G", ""),
            path: mountpoint || `/dev/${name}`, // Use mountpoint if available, otherwise use device name
          };
        });
    }
  } catch (error) {
    term.red(`Error listing USB drives: ${error}\n`);
    return [];
  }
}

async function updateEnvFile(key, value) {
  const envPath = path.join(__dirname, ".env");
  let envContent = await fs.readFile(envPath, "utf8").catch(() => "");

  const regex = new RegExp(`^${key}=.*$`, "m");
  const newLine = `${key}=${value}`;

  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, newLine);
  } else {
    envContent += `\n${newLine}`;
  }

  await fs.writeFile(envPath, envContent.trim() + "\n");
  term.green(`Updated .env file with ${key}=${value}\n`);
}

async function scheduleBackups(backupLocation) {
  try {
    // Load the backup interval from the environment settings
    const envSettings = await loadEnvSettings();
    const backupInterval = parseInt(envSettings.BACKUP_INTERVAL) || 60; // Default to 60 minutes if not set

    const backupFolder = path.join(backupLocation, "database_backup/backups");
    const latestBackupPath = path.join(
      backupLocation,
      "database_backup/latest.db"
    );
    const dbFilePath = path.join(__dirname, "main.db");

    // Log the path of the main.db file for debugging
    term.green(`Source DB path: ${dbFilePath}\n`);

    // Create the backup directory if it doesn't exist
    await fs.mkdir(backupFolder, { recursive: true });

    // Function to create a backup
    const createBackup = async () => {
      // Get today's date in the format of dd-MM-yyyy
      const today = format(new Date(), "dd-MM-yyyy"); // Changed from 'dd/MM/yyyy' to 'dd-MM-yyyy'
      const backupFileName = `${today}.db`;
      const backupFilePath = path.join(backupFolder, backupFileName);

      try {
        // Copy main.db to the backups folder with the date-named file
        await fs.copyFile(dbFilePath, backupFilePath);
        term.green(`Backup created: ${backupFilePath}\n`);

        // Create or update the latest backup to latest.db
        await fs.copyFile(backupFilePath, latestBackupPath);
        term.green(`Latest backup updated: ${latestBackupPath}\n`);
      } catch (error) {
        term.red(`Error creating backup: ${error.message}\n`);
      }
    };

    // Create an initial backup immediately
    await createBackup();

    // Schedule backups based on the interval specified in the .env file
    setInterval(createBackup, backupInterval * 60 * 1000); // Convert minutes to milliseconds
  } catch (error) {
    term.red(`Error scheduling backups! Does the backup location exist?\n`);
  }
}

async function pathExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

function exitHandler() {
  term.yellow("\nOperation canceled.\n");
  term.processExit(0);
}

async function loadEnvSettings() {
  const envPath = path.join(__dirname, ".env");
  let envContent = await fs.readFile(envPath, "utf8").catch(() => "");

  return envContent.split("\n").reduce((acc, line) => {
    const [key, value] = line.split("=");
    acc[key] = value;
    return acc;
  }, {});
}

term.on("key", (name, matches, data) => {
  if (name === "CTRL_C") {
    exitHandler();
  }
});

module.exports = { checkBackupSettings };
