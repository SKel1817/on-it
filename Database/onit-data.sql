-- MySQL Script generated by MySQL Workbench
-- Mon Jan 27 14:42:13 2025
-- Model: New Model    Version: 1.0
-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema onit
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema onit
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `onit` DEFAULT CHARACTER SET utf8 ;
USE `onit` ;

-- -----------------------------------------------------
-- Table `onit`.`user_table`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `onit`.`user_table` ;

CREATE TABLE IF NOT EXISTS `onit`.`user_table` (
  `iduser_table` INT NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(255) NOT NULL,
  `last_name` VARCHAR(255) NULL,
  `username` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `familarity_with_audits` INT NOT NULL,
  `role` VARCHAR(255) NULL,
  `company` VARCHAR(255) NULL,
  `business_indicator` TINYINT NOT NULL,
  PRIMARY KEY (`iduser_table`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `onit`.`audit_response_table`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `onit`.`audit_response_table` ;

CREATE TABLE IF NOT EXISTS `onit`.`audit_response_table` (
  `idaudit_response` INT NOT NULL AUTO_INCREMENT,
  `date` DATETIME NULL,
  `response_step` VARCHAR(45) NOT NULL,
  `response_answer` LONGTEXT NOT NULL COMMENT 'This table might change, right now this is how the JSON file is set up. This will all depend on how Sarah ends up doing stuff, but either way we can still have this set up and based off each step handle the data differently',
  `user_table_iduser_table` INT NOT NULL,
  PRIMARY KEY (`idaudit_response`, `user_table_iduser_table`),
  INDEX `fk_audit_response_user_table_idx` (`user_table_iduser_table` ASC) VISIBLE,
  CONSTRAINT `fk_audit_response_user_table`
    FOREIGN KEY (`user_table_iduser_table`)
    REFERENCES `onit`.`user_table` (`iduser_table`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `onit`.`framworks_table`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `onit`.`frameworks_table` ;

CREATE TABLE IF NOT EXISTS `onit`.`frameworks_table` (
  `framework_id` INT NOT NULL auto_increment,
  `name` VARCHAR(255) NOT NULL,
  `definition` LONGTEXT NOT NULL,
  `how_to_use` LONGTEXT NOT NULL,
  `advantages` LONGTEXT NOT NULL,
  `disadvantages` LONGTEXT NOT NULL,
  `link` TEXT NOT NULL,
  PRIMARY KEY (`framework_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `onit`.`audit_steps_table`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `onit`.`audit_steps_table` ;

CREATE TABLE IF NOT EXISTS `onit`.`audit_steps_table` (
  `idauditsteps` INT NOT NULL auto_increment,
  `Step` VARCHAR(255) NULL,
  `instruction` VARCHAR(255) NULL,
  `explanation` VARCHAR(255) NULL,
  `example` VARCHAR(255) NULL,
  PRIMARY KEY (`idauditsteps`))
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;



--- Inserting data into the tables

-- Inserting data into the user_table
INSERT INTO `onit`.`user_table` (`first_name`, `last_name`, `username`, `email`, `password`, `familarity_with_audits`, `role`, `company`, `business_indicator`)
VALUES
('John','Doe', 'jdoe', 'jdoe@example.com', 'securepassword123', 5, 'Manager', 'ExampleCorp', 1);

-- inserting data into the audit_steps_table
INSERT INTO `onit`.`audit_steps_table` (`idauditsteps`, `Step`, `instruction`, `explanation`, `example`)
VALUES
(1, 'Step1', 'Identify and classify all assets in the organization.', 
"Begin by creating an inventory of all servers, applications, workstations, cloud services, devices, and network architecture within the business. Classify these assets based on their criticality and sensitivity to the organization's operations.", 
'{"AssetID": "ASID12345", "AccessLevel": "Admin-Only", "Owner": "John Doe (IT Manager)"}'),

(2, 'Step1a', 'Identify and classify all servers.', 
'A server is a computer that provides information to other computers. Web servers, database servers, file servers, and email servers need to be assessed.', 
'{"AssetType": "Web Server", "AssetName": "Apache Server", "Criticality": "High", "Classification": "Public"}'),

(3, 'Step1b', 'Identify and classify all applications.', 
'An application is software that performs a specific function for the user. Common applications include Microsoft Excel, PowerPoint, or web browsers like Firefox.', 
'{"AssetType": "Application", "AssetName": "Excel", "Criticality": "Medium", "Classification": "Internal"}'),

(4, 'Step1c', 'Identify and classify all workstations.', 
'Workstations include desktop computers, laptops, and tablets used by employees.', 
'{"AssetType": "Workstation", "AssetName": "Employee Laptop #1234", "Criticality": "Medium", "Classification": "Restricted"}'),

(5, 'Step1d', 'Identify and classify all cloud services.', 
'Cloud services are computing resources delivered over the internet for storage or applications. Examples include Google Drive, Dropbox, AWS, or Google Cloud.', 
'{"AssetType": "Cloud Service", "AssetName": "AWS", "Criticality": "High", "Classification": "Confidential"}'),

(6, 'Step1e', 'Identify and classify all devices.', 
'Devices can include mobile phones used for professional or personal reasons, as well as Internet of Things devices such as printers or cameras.', 
'{"AssetType": "Device", "AssetName": "iPhone 14", "Criticality": "Medium", "Classification": "Confidential"}'),

(7, 'Step1f', 'Identify and classify all network architecture.', 
'Network architecture includes elements that prevent unauthorized access to network resources. Examples are firewalls, routers, switches, and VPN connections.', 
'{"AssetType": "Firewall", "AssetName": "Palo Alto Networks", "Criticality": "High", "Classification": "Restricted"}'),

(8, 'Step2', 'Perform a risk assessment. Take into account common vulnerabilities and threats that may impact assets.', 
'It is important to assess possible vulnerabilities and threats to prioritize security measures and prevent future incidents.', 
'{"RiskLevel": "High", "ThreatType": "Privilege Escalation", "VulnerabilityDescription": "Weak password policy", "MitigationStatus": "Pending", "Impact": "Data breach of customer records", "Likelihood": "Likely"}'),

(9, 'Step2a', 'Assess vulnerabilities and threats in servers.', 
'Common vulnerabilities in servers include unpatched software, weak authentication, and misconfigured firewalls. Threats could include ransomware and privilege escalation.', 
'{"AssetType": "Server", "AssetName": "Database Server I", "Criticality": "High", "Classification": "Confidential"}'),

(10, 'Step2b', 'Assess vulnerabilities and threats in applications.', 
'Vulnerabilities include SQL injection, cross-site scripting, and improper input validation. Potential threats include data breaches.', 
'{"AssetType": "Application", "AssetName": "Internal HR System", "Criticality": "High", "Classification": "Confidential"}'),

(11, 'Step2c', 'Assess vulnerabilities and threats in workstations.', 
'Vulnerabilities include outdated software and weak passwords. Potential threats include phishing, keylogging, ransomware, and malware.', 
'{"AssetType": "Workstation", "AssetName": "CEO Laptop", "Criticality": "High", "Classification": "Confidential"}'),

(12, 'Step2d', 'Assess vulnerabilities and threats in cloud services.', 
'Vulnerabilities include insufficient access controls and insecure APIs. Threats include data breaches and denial of service.', 
'{"AssetType": "Cloud Service", "AssetName": "Dropbox Business Account", "Criticality": "Medium", "Classification": "Restricted"}'),

(13, 'Step2e', 'Assess vulnerabilities and threats in devices.', 
'Vulnerabilities include weak app permissions and lack of two-factor authentication. Threats include theft of devices and ransomware.', 
'{"AssetType": "Device", "AssetName": "Smart Printer - Office 1", "Criticality": "Low", "Classification": "Internal"}'),

(14, 'Step2f', 'Assess vulnerabilities and threats in network architecture.', 
'Vulnerabilities include open ports, weak encryption, and default configurations. Threats include denial-of-service attacks and eavesdropping.', 
'{"AssetType": "Switch", "AssetName": "Cisco Catalyst", "Criticality": "Medium", "Classification": "Internal"}'),

(15, 'Step3', 'Utilize vulnerability and scanning tools.', 
'These tools automate the process of detecting known vulnerabilities. Once the tool provides an assessment, it becomes easier to see which assets are impacted.', 
'{"VulnerabilityID": "CVE-2022-1234", "Severity": "High", "AffectedAsset": "Web Server", "Remediation": "Apply the latest security patch"}'),

(16, 'Step4', 'Conduct a penetration test to evaluate defenses.', 
'Simulate an attack to test the effectiveness of security measures. Document vulnerabilities exploited during the test and provide recommendations to address these issues.', 
'{"VulnerabilityID": "CVE-2023-1234", "Requirement": "SQL Injection", "CurrentState": "Vulnerable", "ActionPlan": "Implement prepared statements for database queries."}'),

(17, 'Step5', 'Create an incident response plan.', 
'Develop a plan that outlines the steps to take in the event of a security breach for specific assets.', 
'{"TestType": "Phishing Simulation", "Findings": "20% of employees clicked on phishing emails.", "Recommendation": "Implement mandatory phishing awareness training."}'),

(18, 'Step6', 'Create a continuous improvement plan for employees.', 
'Implement training and awareness programs to educate employees with various access levels.', 
'{"IncidentType": "Data Breach", "Steps": "Identify affected systems, Notify stakeholders, Secure the breach, Conduct a forensic investigation", "ContactInfo": "IT Security Team (security@company.com)"}');


-- Inserting data into the audit_response_table
INSERT INTO `onit`.`audit_response_table` (`date`,`response_step`, `response_answer`, `user_table_iduser_table`)
VALUES
(NOW(), 'Step1', 
'{"AssetID": "ASID12345", "AccessLevel": "Admin-Only", "Owner": "John Doe (IT Manager)"}', 1),

(NOW(), 'Step1a', 
'{"AssetType": "Web Server", "AssetName": "Apache Server", "Criticality": "High", "Classification": "Public"}', 1),

(NOW(), 'Step1b', 
'{"AssetType": "Application", "AssetName": "Excel", "Criticality": "Medium", "Classification": "Internal"}', 1),

(NOW(), 'Step1c', 
'{"AssetType": "Workstation", "AssetName": "Employee Laptop #1234", "Criticality": "Medium", "Classification": "Restricted"}', 1),

(NOW(), 'Step1d', 
'{"AssetType": "Cloud Service", "AssetName": "AWS", "Criticality": "High", "Classification": "Confidential"}', 1),

(NOW(), 'Step1e', 
'{"AssetType": "Device", "AssetName": "iPhone 14", "Criticality": "Medium", "Classification": "Confidential"}', 1),

(NOW(), 'Step1f', 
'{"AssetType": "Firewall", "AssetName": "Palo Alto Networks", "Criticality": "High", "Classification": "Restricted"}', 1),

(NOW(), 'Step2', 
'{"RiskLevel": "High", "ThreatType": "Privilege Escalation", "VulnerabilityDescription": "Weak password policy", "MitigationStatus": "Pending", "Impact": "Data breach of customer records", "Likelihood": "Likely"}', 1),

(NOW(), 'Step2a', 
'{"AssetType": "Server", "AssetName": "Database Server I", "Criticality": "High", "Classification": "Confidential"}', 1),

(NOW(), 'Step2b', 
'{"AssetType": "Application", "AssetName": "Internal HR System", "Criticality": "High", "Classification": "Confidential"}', 1),

(NOW(), 'Step2c', 
'{"AssetType": "Workstation", "AssetName": "CEO Laptop", "Criticality": "High", "Classification": "Confidential"}', 1),

(NOW(), 'Step2d', 
'{"AssetType": "Cloud Service", "AssetName": "Dropbox Business Account", "Criticality": "Medium", "Classification": "Restricted"}', 1),

(NOW(), 'Step2e', 
'{"AssetType": "Device", "AssetName": "Smart Printer - Office 1", "Criticality": "Low", "Classification": "Internal"}', 1),

(NOW(), 'Step2f', 
'{"AssetType": "Switch", "AssetName": "Cisco Catalyst", "Criticality": "Medium", "Classification": "Internal"}', 1),

(NOW(), 'Step3', 
'{"VulnerabilityID": "CVE-2022-1234", "Severity": "High", "AffectedAsset": "Web Server", "Remediation": "Apply the latest security patch"}', 1),

(NOW(), 'Step4', 
'{"VulnerabilityID": "CVE-2023-1234", "Requirement": "SQL Injection", "CurrentState": "Vulnerable", "ActionPlan": "Implement prepared statements for database queries."}', 1),

(NOW(), 'Step5', 
'{"TestType": "Phishing Simulation", "Findings": "20% of employees clicked on phishing emails.", "Recommendation": "Implement mandatory phishing awareness training."}', 1),

(NOW(), 'Step6', 
'{"IncidentType": "Data Breach", "Steps": "Identify affected systems, Notify stakeholders, Secure the breach, Conduct a forensic investigation", "ContactInfo": "IT Security Team (security@company.com)"}', 1);


-- Inserting data into the frameworks_table

INSERT INTO `onit`.`frameworks_table` (`name`, `definition`, `how_to_use`, `advantages`, `disadvantages`, `link`)
VALUES
("ISO 27001/ISO 27002", 
"ISO 27001 is an international standard that provides a framework for risk assessment, control selection, and implementation. This framework is best when used in tandem with ISO 27002. ISO 27002 contains detailed guidelines for selecting and implementing security controls outlined in ISO 27001.", 
"1. Assess the organization\'s size, industry, and information assets. Identify the Information Security Management System (ISMS).\n2. Perform a risk assessment, assess their impacts, likelihood, and prioritize them.\n3. Use ISO 27002 in order to identify specific controls such as access management and encryption.\n4. Based on specific controls in the organization, create security policies and risk treatment plans.\n5. Continue to monitor and review the organization\'s level of risk, and conduct regular risk assessments to identify threats.\n6. Educate staff about ISO 27001/27002 guidelines.", 
"Robust.\nInformation Security Management System is identified.\nEffective security measures.", 
"Highly technical.\nKnowledge gap in implementation.",
"https://drata.com/grc-central/iso-27001/iso-27001-vs-iso-27002"),

("NIST CSF", 
"Framework created by the National Institute of Standards and Technology (NIST). It is organized into five core functions: Identify, Protect, Detect, Respond, and Recover. The main goal of this framework is to align cybersecurity activities with business requirements.", 
"1. Use the main functions (Identify, Protect, Detect, Respond, and Recover) to evaluate current cybersecurity systems.\n2. Determine the most critical assets, risks, and threats based on the specific organization.\n3. Decide what threats are most critical, and where the organization\'s cybersecurity state needs improvement.\n4. Apply best practices to address these threats and continually reassess current threats and vulnerabilities.", 
"Flexible.\nCommon terminology reduces confusion.", 
"55-page manual is long to read.\nSelf-assessment leads to no clear standards.", 
"https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf"),

("CIS Controls", 
"Best practices developed by the Center of Internet Security (CIS) that contain 18 high-priority actions. These are grouped into three groups: Basic, Foundational, and Organizational. Basic controls are essential for small organizations. Foundational controls are for a company with a more mature security program. Organizational controls assess security policies and governance.", 
"1. Understand and assess the 18 CIS controls, such as secure configuration, vulnerability management, and inventory and control of assets.\n2. Conduct a self-assessment to identify gaps in current security practices compared to CIS controls.\n3. Start with basic controls, then foundational, and finally organizational controls to establish a strong security foundation. Apply these controls incrementally.\n4. Regularly review and update the approach to address different threats or business changes.", 
"Simple and actionable.\nMapped to real-world threats.", 
"Not as comprehensive as other frameworks.\nRequires regular updates.", 
"https://www.cisecurity.org/controls"),

("COBIT", 
"COBIT is the Control Objectives for Information and Related Technologies and is a specific framework for IT governance and management. This framework includes tools, practices, and models to manage an IT organization.", 
"1. Figure out IT compliance objectives with business goals and needs, focusing on risk management and prevention.\n2. Perform a gap analysis to assess IT governance practices currently used in the company.\n3. Apply COBIT principles, including evaluating stakeholder needs, having clear responsibilities and roles, and regularly assessing and making recommendations for performance management.\n4. Continuously improve governance practices to understand different business needs.", 
"Aligns IT with business needs.\nDetailed governance framework.", 
"Complex implementation for small businesses.\nExpensive and time-consuming.", 
"https://www.techtarget.com/searchsecurity/definition/COBIT"),

("ISO/IEC 27701", 
"International Standard for privacy information management. This framework extends ISO 27001 to focus on personally identifiable information. The main goal of this framework is to protect personally identifiable information.", 
"1. Integrate with ISO 27001 if already using that framework. If not, begin with ISO 27001, then return to ISO/IEC 27701.\n2. Define the personally identifiable information that the organization stores, collects, and shares.\n3. Perform a risk assessment to determine appropriate privacy controls to mitigate risks.\n4. Develop privacy policies and controls that cover data handling, user rights, and breach response actions.\n5. Train employees on privacy laws and how to protect personally identifiable information.\n6. Continuously monitor and assess privacy policies and controls to decide when changes are necessary.", 
"Expands ISO 27001 for privacy information management.", 
"Complicated integration with existing systems.\nHigh implementation costs.", 
"https://www.vanta.com/collection/iso-27001/guide-to-iso-27701");

