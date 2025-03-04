I'm sorry for the confusion earlier. Based on your new understanding, here is how I want you to restructure the task:



so, We need to generate a task for AI models to review code. The task consists of three components:
- The prompt
- The base code
- The unit test (this is not a regular Jest unit test; itserves as the evaluation criteria for the LLM's review- I will explain better)

Only the prompt and the base code will be provided to the LLM as the task. The unit test will be entered in a separate field to prevent giving away the expected answers.

Lets take it one by one

1. The Base Code  
This is the code that the AI models will review, the base code should intentionally include:
- Security flaws
- Inefficiencies
- Bad practices
- Non-standard style
- Repeated logic or bugs

*Note:* The primary risk is that the LLM might provide a good, reasonable code review but then perform poorly on the rubric used by the LLM judge. To mitigate this risk, ensure that the intentional mistakes are the most obvious ones, leaving little room for alternative interpretations. 


2. The Prompt  
This prompt is common to all tasks and must always read as follows:

```
Please do a code review for the above code. Please look especially for things like:
 - Bad practices
 - Security vulnerabilities
 - Clear inefficiencies
 - Bugs
Please mention only the 4-10 most obvious and clearest points that would always be mentioned in a good code review. Please make your code review accurate and clear while also being concise.
```
Note: The only variable part of the prompt is the range of points to be noted (it must always be no fewer than 4, but can vary, for example, 4-8 or 4-10, to adjust the difficulty).



3. The Unit Test  
This is not actual executable code but rather a set of criteria that the LLM’s review should address. It is formatted as follows:

Introduction:
```
Please rate the quality of the code review for the above JavaScript code. The reviewer was asked to look especially for things like:
 - Bad practices
 - Security vulnerabilities
 - Clear inefficiencies
 - Bugs
And the reviewer was asked to mention only the most obvious and clearest points that would definitely be included in a good code review. Here is what we are looking for:
```

*Followed by a bullet list detailing the expected points. For example:*
- The code review should point out that...
- The code review should point out that...


Now this next part is not what you will do, But I want you to have a full understanding of what a task entails.
Evaluation Process After LLM Response:  
Once the LLMs has provided its review, we will use a tool (https://llmjudge.streamlit.app/) to evaluate it. The evaluation will be done as follows:
- we will provide the judge with:
  - The evaluation criteria (the bullet points listed in the unit test)
  - The unreviewed base code
  - The AI’s (LLM’s) review response
- Click “Evaluate” to have the judge score the LLM, list out the points it addressed (or failed to address), and provide a score out of 10.

*For a hard task, the target is for the score to be less than 50%.*



Is this clear? Let me know if any further adjustments are needed. Based on your feedback, hel me update the task accordingly.

