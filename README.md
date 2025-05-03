## Distributed Systems - Event-Driven Architecture.

__Name:__ Yuheng Gu

__Demo__: https://youtu.be/5dFd4Pxu-M4

This repository contains the implementation of a skeleton design for an application that manages a photo gallery, illustrated below. The app uses an event-driven architecture and is deployed on the AWS platform using the CDK framework for infrastructure provisioning.

![Architecture](./images/arch.png)

---

###  Code Status

[Advice: In this section, state the status of your submission for each feature listed below. The status options are: (1) Completed & Tested; (2) Attempted (i.e. partially works); (3) Not Attempted. Option (1) implies the feature performs the required action (e.g. updates the table) __only when appropriate__, as dictated by the relevant filtering policy described in the specification.]

__Feature:__
+ Photographer:
  + Log new Images - **Completed and Tested**
  + Upload Trigger Handling (via S3) - **Completed and Tested**
  + Image Validation (format/size) - **Completed and Tested**
  + Metadata updating - **Completed and Tested**
  + DynamoDB Record Creation - **Completed and Tested**
  + Invalid image removal - **Completed and Tested**
  + Status Update Mailer (via SES) - **Completed and Tested**
+ Moderator:
  + Status updating - **Completed and Tested**
  + Reason Logging - **Completed and Tested**
  + Event Filtering Policy - **Completed and Tested**
+ Messaging & Infrastructure:
  + SNS Topic Configuration - **Completed and Tested**
  + Subscription Filtering - **Completed and Tested**
  + SQS Dead Letter Queue (DLQ) - **Completed and Tested**
  + IAM Least Privilege Roles - **Completed and Tested**
+ Email (SES):
  + Photographer Confirmation Mail - **Completed and Tested**
  + Verified Sender/Receiver Setup - **Completed and Tested**

---

###  System Behavior

These messages should trigger the **Update Status** Lambda, which updates the image’s table item — the message’s `status` and `reason` are written to the database.

The **Confirmation Mailer Lambda** will notify the photographer via email when an image’s status changes.

All subscribers to the SNS topic must **filter out irrelevant messages**.  


This filtering is implemented via **SNS subscription filter policies**, ensuring that each Lambda function processes only the event types it's responsible for.

---




