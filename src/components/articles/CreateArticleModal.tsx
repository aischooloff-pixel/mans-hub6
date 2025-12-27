import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockCategories } from '@/data/mockData';
import { Send, Image, Link2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useArticles } from '@/hooks/use-articles';

interface CreateArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateArticleModal({ isOpen, onClose, onSuccess }: CreateArticleModalProps) {
  const { createArticle, loading } = useArticles();
  const [formData, setFormData] = useState({
    category_id: '',
    title: '',
    body: '',
    media_url: '',
    is_anonymous: false,
    sources: '',
    allow_comments: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Введите заголовок статьи');
      return;
    }
    
    if (!formData.body.trim()) {
      toast.error('Введите текст статьи');
      return;
    }

    if (formData.body.trim().length < 100) {
      toast.error('Статья должна содержать минимум 100 символов');
      return;
    }

    const article = await createArticle({
      category_id: formData.category_id,
      title: formData.title.trim(),
      body: formData.body.trim(),
      media_url: formData.media_url.trim() || undefined,
      is_anonymous: formData.is_anonymous,
      allow_comments: formData.allow_comments,
    });

    if (article) {
      onClose();
      onSuccess?.();
      setFormData({
        category_id: '',
        title: '',
        body: '',
        media_url: '',
        is_anonymous: false,
        sources: '',
        allow_comments: true,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Новая статья</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <Label>Категория</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) =>
                setFormData({ ...formData, category_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {mockCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Заголовок *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Введите заголовок статьи"
              maxLength={200}
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label>Текст статьи * (минимум 100 символов)</Label>
            <Textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Напишите вашу статью..."
              rows={8}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.body.length} символов
            </p>
          </div>

          {/* Media URL */}
          <div className="space-y-2">
            <Label>Медиа (опционально)</Label>
            <div className="flex gap-2">
              <Input
                value={formData.media_url}
                onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                placeholder="YouTube URL или ссылка на изображение"
                className="flex-1"
              />
              <Button type="button" variant="outline" size="icon">
                <Image className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon">
                <Link2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Sources */}
          <div className="space-y-2">
            <Label>Источники (опционально)</Label>
            <Input
              value={formData.sources}
              onChange={(e) => setFormData({ ...formData, sources: e.target.value })}
              placeholder="Ссылки на источники через запятую"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-4 rounded-xl bg-secondary/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Анонимная публикация</Label>
                <p className="text-xs text-muted-foreground">
                  Ваше имя не будет отображаться
                </p>
              </div>
              <Switch
                checked={formData.is_anonymous}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_anonymous: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Разрешить комментарии</Label>
                <p className="text-xs text-muted-foreground">
                  Другие пользователи смогут комментировать
                </p>
              </div>
              <Switch
                checked={formData.allow_comments}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, allow_comments: checked })
                }
              />
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Отправка...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Отправить на модерацию
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
