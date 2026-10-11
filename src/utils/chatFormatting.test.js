import { chatHtml, chatPlainText } from './chatFormatting';

describe('chatHtml', () => {
  it('turns bold and headings into tags instead of leaving asterisks', () => {
    expect(chatHtml('**Hello** there')).toBe('<strong>Hello</strong> there');
    expect(chatHtml('### Greetings')).toBe('<strong>Greetings</strong>');
    expect(chatHtml('**Hello** there')).not.toContain('*');
  });

  it('renders markdown and unicode bullets the same way', () => {
    const star = chatHtml('* one\n- two\n• three');
    expect(star.match(/•/g)).toHaveLength(3);
    expect(star).not.toContain('*');
    expect(star).not.toContain('- two');
  });

  it('drops horizontal rules and stray asterisks', () => {
    expect(chatHtml('a\n***\nb')).toBe('a<br/>b');
    expect(chatHtml('odd *** marks ** here')).toBe('odd  marks  here');
  });

  it('keeps italics but leaves arithmetic alone', () => {
    expect(chatHtml('say *marhaba* now')).toBe('say <em>marhaba</em> now');
    expect(chatHtml('2 * 3 = 6')).toBe('2  3 = 6');
  });

  it('collapses blank lines and escapes html', () => {
    expect(chatHtml('a\n\n\n\nb')).toBe('a<br/><br/>b');
    expect(chatHtml('<img onerror=1>')).toBe('&lt;img onerror=1&gt;');
  });

  it('handles Arabic text with bold', () => {
    expect(chatHtml('• **مرحبا** means hello')).toBe(
      '<span style="display: inline-block; margin-right: 8px;">•</span><strong>مرحبا</strong> means hello'
    );
  });
});

describe('chatPlainText', () => {
  it('strips every marker for speech', () => {
    expect(chatPlainText('### Hi\n* **one**\n---\n> two')).toBe('Hi\n• one\ntwo');
  });
});
