/**
 * Contact Form Manager
 * Client-side validation, honeypot protection, server dispatch, and feedback handling.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class ContactManager {
  constructor(formElementId = 'contact-form', feedbackElementId = 'contact-feedback') {
    this.form = document.getElementById(formElementId);
    this.feedback = document.getElementById(feedbackElementId);
    this.isSubmitting = false;

    if (this.form) {
      this.init();
    }
  }

  init() {
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  validate(data) {
    const errors = {};

    if (!data.name || data.name.trim().length < 2) {
      errors.name = 'Please enter your name (at least 2 characters).';
    } else if (data.name.trim().length > 100) {
      errors.name = 'Name cannot exceed 100 characters.';
    }

    if (!data.email || !EMAIL_REGEX.test(data.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    } else if (data.email.trim().length > 150) {
      errors.email = 'Email address cannot exceed 150 characters.';
    }

    if (!data.subject || data.subject.trim().length < 2) {
      errors.subject = 'Please enter a subject (at least 2 characters).';
    } else if (data.subject.trim().length > 150) {
      errors.subject = 'Subject cannot exceed 150 characters.';
    }

    if (!data.message || data.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters.';
    } else if (data.message.trim().length > 3000) {
      errors.message = 'Message cannot exceed 3,000 characters.';
    }

    return errors;
  }

  async handleSubmit() {
    if (this.isSubmitting) return;

    // Clear previous inline errors
    this.clearErrors();

    const formData = new FormData(this.form);
    const data = {
      name: formData.get('name') || '',
      email: formData.get('email') || '',
      subject: formData.get('subject') || '',
      message: formData.get('message') || '',
      _gotcha: formData.get('_gotcha') || '' // Honeypot field
    };

    // Client-side validation
    const errors = this.validate(data);
    if (Object.keys(errors).length > 0) {
      this.displayErrors(errors);
      return;
    }

    // Submit state
    this.setSubmitting(true);
    this.showFeedback('Transmitting message...', 'info');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (result.errors && typeof result.errors === 'object') {
          this.displayErrors(result.errors);
        }
        throw new Error(result.message || `Server returned error (${response.status})`);
      }

      // Success
      this.showFeedback(
        result.message || 'Thank you! Your message has been sent successfully.',
        'success'
      );

      // Clear form inputs only upon confirmed success
      this.form.reset();

    } catch (err) {
      console.warn('Contact form submission error:', err);
      // Show failure feedback without losing the user's entered message!
      this.showFeedback(
        err.message || 'Unable to deliver message. Please check your connection and try again.',
        'error'
      );
    } finally {
      this.setSubmitting(false);
    }
  }

  setSubmitting(state) {
    this.isSubmitting = state;
    const submitBtn = this.form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = state;
      if (state) {
        submitBtn.dataset.originalText = submitBtn.textContent;
        submitBtn.textContent = 'Transmitting...';
      } else if (submitBtn.dataset.originalText) {
        submitBtn.textContent = submitBtn.dataset.originalText;
      }
    }
  }

  showFeedback(message, type = 'info') {
    if (!this.feedback) return;
    this.feedback.textContent = message;
    this.feedback.className = `contact-feedback-banner ${type}`;
    this.feedback.style.display = 'block';
  }

  displayErrors(errors) {
    for (const [field, errorMsg] of Object.entries(errors)) {
      const input = this.form.querySelector(`[name="${field}"]`);
      if (input) {
        input.classList.add('input-error');
        const errSpan = document.createElement('span');
        errSpan.className = 'field-error-text';
        errSpan.textContent = errorMsg;
        input.parentNode.appendChild(errSpan);
      }
    }
    this.showFeedback('Please correct the highlighted fields.', 'error');
  }

  clearErrors() {
    this.form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    this.form.querySelectorAll('.field-error-text').forEach(el => el.remove());
    if (this.feedback) {
      this.feedback.style.display = 'none';
      this.feedback.className = 'contact-feedback-banner';
    }
  }
}
