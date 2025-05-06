import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Image as ImageIcon, 
  Plus, 
  Type, 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Save, 
  Eye, 
  ArrowRight, 
  X,
  Trash2,
  FileQuestion,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { threadService } from "@/lib/services/thread.service";
import { draftService } from "@/lib/services/draft.service";

interface ThreadSegment {
  id: string;
  content: string;
  type: 'text';
}

interface ThreadData {
  id: string;
  title: string;
  coverImage: string | null;
  segments: ThreadSegment[];
  tags: string[];
  isPublic: boolean;
  lastSaved: Date | null;
}

const PREDEFINED_TAGS = [
  "Productivity",
  "Mindfulness",
  "Career",
  "Technology",
  "Creativity",
  "Health",
  "Philosophy",
  "Learning"
];

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

const ThreadCreator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const draftId = queryParams.get('draft');
  const forkId = queryParams.get('fork');
  const remixFrom = queryParams.get('remixFrom');
  const threadId = queryParams.get('thread');
  
  const [thread, setThread] = useState<ThreadData>({
    id: generateId(),
    title: '',
    coverImage: null,
    segments: [{ id: generateId(), content: '', type: 'text' }],
    tags: [],
    isPublic: true,
    lastSaved: null
  });
  
  const [customTag, setCustomTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [showCoverImageField, setShowCoverImageField] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Load draft or fork if specified
  useEffect(() => {
    const loadThread = async () => {
      if (remixFrom) {
        try {
          setIsLoading(true);
          // Load the original thread for pre-filling
          const threadData = await threadService.getThreadById(remixFrom);
          setThread({
            id: generateId(),
            title: threadData.title,
            coverImage: threadData.cover_image || null,
            segments: threadData.segments.map((seg: any) => ({
              id: generateId(),
              content: seg.content,
              type: 'text'
            })),
            tags: threadData.tags || [],
            isPublic: threadData.is_published,
            lastSaved: new Date()
          });
          toast({
            title: "Thread remixed",
            description: "You're now working on a remix. Save or publish to create your own version.",
          });
        } catch (error) {
          console.error("Error loading thread for remix:", error);
          toast({
            title: "Error loading thread",
            description: "The thread could not be loaded. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
        return;
      }
      if (draftId && !forkId) {
        try {
          setIsLoading(true);
          // Load draft by ID for editing
          const draftData = await draftService.getDraftById(draftId);
          // Parse content (should be an array of segments)
          let segments: ThreadSegment[] = [];
          if (Array.isArray(draftData.content)) {
            segments = draftData.content.map((seg: any) => ({
              id: seg.id || generateId(),
              content: seg.content || '',
              type: seg.type || 'text',
            }));
          } else if (typeof draftData.content === 'string') {
            try {
              const parsed = JSON.parse(draftData.content);
              segments = Array.isArray(parsed)
                ? parsed.map((seg: any) => ({
                    id: seg.id || generateId(),
                    content: seg.content || '',
                    type: seg.type || 'text',
                  }))
                : [{ id: generateId(), content: parsed, type: 'text' }];
            } catch {
              segments = [{ id: generateId(), content: draftData.content, type: 'text' }];
            }
          }
          setThread({
            id: draftData.id,
            title: draftData.title,
            coverImage: null, // Add cover image if you store it in drafts
            segments: segments.length > 0 ? segments : [{ id: generateId(), content: '', type: 'text' }],
            tags: [], // Add tags if you store them in drafts
            isPublic: false,
            lastSaved: draftData.updated_at ? new Date(draftData.updated_at) : null
          });
          toast({
            title: "Draft loaded",
            description: "Your draft has been loaded for editing.",
          });
        } catch (error) {
          console.error("Error loading draft:", error);
          toast({
            title: "Error loading draft",
            description: "The draft could not be loaded. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
        return;
      } else if (forkId) {
        try {
          setIsLoading(true);
          const id = forkId;
          if (!id) return;
          const threadData = await threadService.getThreadById(id);
          setThread({
            id: generateId(),
            title: threadData.title,
            coverImage: threadData.cover_image || null,
            segments: threadData.segments.map((seg: any) => ({
              id: generateId(),
              content: seg.content,
              type: 'text'
            })),
            tags: threadData.tags || [],
            isPublic: threadData.is_published,
            lastSaved: new Date()
          });
          toast({
            title: "Thread remixed",
            description: "You're now working on a remix. Save or publish to create your own version.",
          });
        } catch (error) {
          console.error("Error loading thread:", error);
          toast({
            title: "Error loading thread",
            description: "The thread could not be loaded. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      } else if (threadId) {
        try {
          setIsLoading(true);
          const threadData = await threadService.getThreadById(threadId);
          setThread({
            id: threadData.id,
            title: threadData.title,
            coverImage: threadData.cover_image || null,
            segments: threadData.segments.map((seg: any) => ({
              id: generateId(),
              content: seg.content,
              type: 'text'
            })),
            tags: threadData.tags || [],
            isPublic: threadData.is_published,
            lastSaved: threadData.updated_at ? new Date(threadData.updated_at) : null
          });
          toast({
            title: "Thread loaded",
            description: "Your thread has been loaded for editing.",
          });
        } catch (error) {
          console.error("Error loading thread for editing:", error);
          toast({
            title: "Error loading thread",
            description: "The thread could not be loaded. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
        return;
      }
    };
    loadThread();
  }, [draftId, forkId, remixFrom, threadId]);
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setThread(prev => ({ ...prev, title: e.target.value }));
  };
  
  const handleSegmentChange = (id: string, content: string) => {
    setThread(prev => ({
      ...prev,
      segments: prev.segments.map(segment => 
        segment.id === id ? { ...segment, content } : segment
      )
    }));
  };
  
  const handleAddSegment = () => {
    const newSegment = { id: generateId(), content: '', type: 'text' as const };
    setThread(prev => ({ ...prev, segments: [...prev.segments, newSegment] }));
  };
  
  const handleRemoveSegment = (id: string) => {
    if (thread.segments.length <= 1) {
      toast({
        title: "Cannot remove segment",
        description: "A thread must have at least one segment.",
        variant: "destructive"
      });
      return;
    }
    
    setThread(prev => ({
      ...prev,
      segments: prev.segments.filter(segment => segment.id !== id)
    }));
  };
  
  const handleSave = async (publish = false) => {
    try {
      setIsSaving(true);
      // Validate content
      if (!thread.title.trim()) {
        toast({
          title: "Title required",
          description: "Please add a title to your thread.",
          variant: "destructive"
        });
        return;
      }
      if (thread.segments.some(s => !s.content.trim())) {
        toast({
          title: "Empty segments",
          description: "Please fill in all segments or remove empty ones.",
          variant: "destructive"
        });
        return;
      }
      // Format data for the API
      const threadData = {
        title: thread.title,
        segments: thread.segments.map((seg, index) => ({
          content: seg.content,
          order_index: index
        })),
        tags: thread.tags,
        is_published: publish,
        cover_image: thread.coverImage
      };
      let savedThread;
      if (draftId && !forkId) {
        // Publishing a draft: create a new thread from the draft
        savedThread = await threadService.createThread(
          threadData.title,
          threadData.segments.map(s => s.content),
          threadData.tags,
          threadData.cover_image || undefined,
          true, // isPublished
          !thread.isPublic
        );
        // Optionally, delete the draft after publishing
        await draftService.deleteDraft(draftId);
      } else {
        // Create new thread (normal flow)
        savedThread = await threadService.createThread(
          threadData.title,
          threadData.segments.map(s => s.content),
          threadData.tags,
          threadData.cover_image || undefined,
          publish,
          !thread.isPublic
        );
      }
      setThread(prev => ({ 
        ...prev, 
        id: savedThread.id,
        lastSaved: new Date()
      }));
      toast({
        title: publish ? "Thread published" : "Thread saved",
        description: publish 
          ? "Your thread has been published successfully." 
          : "Your thread has been saved as a draft.",
      });
      if (publish) {
        // Navigate to view the published thread
        navigate(`/thread/${savedThread.id}`);
      }
    } catch (error: any) {
      console.error("Error saving thread:", error);
      toast({
        title: "Error saving thread",
        description: error?.message || (typeof error === 'string' ? error : 'There was a problem saving your thread. Please try again.'),
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleTagToggle = (tag: string) => {
    setThread(prev => {
      const exists = prev.tags.includes(tag);
      if (exists) {
        return { ...prev, tags: prev.tags.filter(t => t !== tag) };
      } else {
        if (prev.tags.length >= 5) {
          toast({
            title: "Maximum tags reached",
            description: "You can add up to 5 tags per thread.",
            variant: "destructive"
          });
          return prev;
        }
        return { ...prev, tags: [...prev.tags, tag] };
      }
    });
  };
  
  const handleAddCustomTag = () => {
    if (!customTag.trim()) return;
    
    if (customTag.length > 20) {
      toast({
        title: "Tag too long",
        description: "Tags should be 20 characters or less.",
        variant: "destructive"
      });
      return;
    }
    
    if (thread.tags.includes(customTag)) {
      toast({
        description: "This tag already exists.",
        variant: "destructive"
      });
      return;
    }
    
    if (thread.tags.length >= 5) {
      toast({
        title: "Maximum tags reached",
        description: "You can add up to 5 tags per thread.",
        variant: "destructive"
      });
      return;
    }
    
    setThread(prev => ({ ...prev, tags: [...prev.tags, customTag] }));
    setCustomTag('');
  };
  
  const handleAddCoverImage = () => {
    if (!coverImageUrl.trim()) {
      return;
    }
    
    setThread(prev => ({ ...prev, coverImage: coverImageUrl }));
    setCoverImageUrl('');
    setShowCoverImageField(false);
  };
  
  const handlePrivacyChange = (isPublic: boolean) => {
    setThread(prev => ({ ...prev, isPublic }));
  };
  
  // Add this new function for saving drafts
  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      if (!thread.title.trim()) {
        toast({
          title: "Title required",
          description: "Please add a title to your draft.",
          variant: "destructive"
        });
        return;
      }
      if (thread.segments.some(s => !s.content.trim())) {
        toast({
          title: "Empty segments",
          description: "Please fill in all segments or remove empty ones.",
          variant: "destructive"
        });
        return;
      }
      const content = thread.segments.map(seg => ({ content: seg.content, type: seg.type }));
      let savedDraft;
      if (draftId) {
        savedDraft = await draftService.updateDraft(draftId, thread.title, content);
      } else {
        savedDraft = await draftService.createDraft(thread.title, content);
      }
      setThread(prev => ({ ...prev, id: savedDraft.id, lastSaved: new Date() }));
      toast({ title: "Draft saved", description: "Your draft has been saved." });
    } catch (error: any) {
      toast({ title: "Error saving draft", description: error.message || "There was a problem saving your draft.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      {showPreview ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold font-playfair">Preview</h1>
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              className="flex items-center"
            >
              <Type className="mr-2 h-4 w-4" />
              Back to Editor
            </Button>
          </div>
          
          <div className="space-y-8 bg-card shadow-sm border border-border rounded-lg p-6">
            <div className="space-y-4">
              {thread.coverImage && (
                <div className="relative w-full h-64 mb-6 overflow-hidden rounded-lg">
                  <img 
                    src={thread.coverImage} 
                    alt="Thread cover" 
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              
              <h1 className="text-3xl font-playfair font-semibold">{thread.title || "Untitled Thread"}</h1>
              
              <div className="flex flex-wrap gap-2">
                {thread.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="px-3 py-1 bg-threadspire-navy/10 text-threadspire-navy dark:bg-threadspire-navy/20 dark:text-threadspire-paper rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="space-y-6">
              {thread.segments.map((segment, index) => (
                <div key={segment.id} className="thread-segment">
                  <div className="prose dark:prose-invert max-w-none">
                    {segment.content || <span className="text-muted-foreground italic">No content for this segment</span>}
                  </div>
                  {index < thread.segments.length - 1 && (
                    <div className="thread-segment-connector" />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              <Type className="mr-2 h-4 w-4" />
              Back to Editor
            </Button>
            <Button onClick={() => handleSave(true)} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  Publish Thread
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold font-playfair">Create a New Thread</h1>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-muted-foreground">
                {thread.lastSaved 
                  ? `Last saved: ${new Date(thread.lastSaved).toLocaleTimeString()}`
                  : 'Not saved yet'}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSaveDraft}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-1 h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Thread Title and Cover Image */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Thread Title"
                    value={thread.title}
                    onChange={handleTitleChange}
                    className="text-3xl font-playfair w-full bg-transparent border-none outline-none focus:ring-0 placeholder:text-muted-foreground/50"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  {thread.coverImage ? (
                    <div className="relative">
                      <img 
                        src={thread.coverImage} 
                        alt="Cover" 
                        className="h-12 w-20 object-cover rounded-md"
                      />
                      <button
                        onClick={() => setThread(prev => ({ ...prev, coverImage: null }))}
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center"
                        aria-label="Remove cover image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowCoverImageField(!showCoverImageField)}
                          >
                            <ImageIcon className="h-4 w-4 mr-1" />
                            Add Cover
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Add a cover image to your thread
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
              
              {showCoverImageField && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter image URL"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-1 focus:ring-threadspire-gold"
                  />
                  <Button onClick={handleAddCoverImage} size="sm">Add</Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowCoverImageField(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            
            {/* Thread Segments */}
            <div className="space-y-6">
              {thread.segments.map((segment, index) => (
                <div key={segment.id} className="relative thread-segment">
                  <div className="mb-4 flex justify-between items-center">
                    <div className="flex space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Bold className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Bold</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Italic className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Italic</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <List className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Bullet List</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <ListOrdered className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Numbered List</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <LinkIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Add Link</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRemoveSegment(segment.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  
                  <textarea
                    value={segment.content}
                    onChange={(e) => handleSegmentChange(segment.id, e.target.value)}
                    placeholder="Write your thoughts here..."
                    className="w-full h-32 bg-transparent border-none outline-none focus:ring-0 resize-none"
                  />
                  
                  {index < thread.segments.length - 1 && (
                    <div className="thread-segment-connector" />
                  )}
                </div>
              ))}
              
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  className="flex items-center"
                  onClick={handleAddSegment}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Segment
                </Button>
              </div>
            </div>
            
            {/* Thread Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
              {/* Tags Selection */}
              <div>
                <h3 className="text-lg font-medium mb-3">Tags</h3>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_TAGS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          thread.tags.includes(tag)
                            ? 'bg-threadspire-navy text-white'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add custom tag"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-1 focus:ring-threadspire-gold"
                      maxLength={20}
                    />
                    <Button 
                      size="sm"
                      disabled={!customTag.trim() || thread.tags.length >= 5}
                      onClick={handleAddCustomTag}
                    >
                      Add
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {thread.tags.map(tag => (
                      <div 
                        key={tag}
                        className="px-3 py-1 bg-threadspire-navy text-white dark:bg-threadspire-gold dark:text-threadspire-navy rounded-full text-xs flex items-center"
                      >
                        {tag}
                        <button
                          onClick={() => handleTagToggle(tag)}
                          className="ml-2 focus:outline-none"
                          aria-label={`Remove ${tag} tag`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {thread.tags.length >= 5 && (
                    <p className="text-xs text-muted-foreground">
                      Maximum of 5 tags reached.
                    </p>
                  )}
                </div>
              </div>
              
              {/* Privacy Settings and Help */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-3">Privacy</h3>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handlePrivacyChange(true)}
                      className={`px-4 py-2 rounded-md flex items-center ${
                        thread.isPublic ? 'bg-threadspire-navy text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      Public
                    </button>
                    <button
                      onClick={() => handlePrivacyChange(false)}
                      className={`px-4 py-2 rounded-md flex items-center ${
                        !thread.isPublic ? 'bg-threadspire-navy text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      Private
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {thread.isPublic 
                      ? 'Public threads are visible to all users and can be featured on the explore page.'
                      : 'Private threads are only visible to you.'}
                  </p>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center space-x-2">
                      <FileQuestion className="h-4 w-4" />
                      <span>Thread Creation Help</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-playfair">Creating a Great Thread</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <AlertCircle className="h-5 w-5 text-threadspire-gold" />
                        </div>
                        <div>
                          <h4 className="font-medium">Focus on Connections</h4>
                          <p className="text-sm text-muted-foreground">
                            Threads work best when each segment connects to the next one with a logical flow.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <AlertCircle className="h-5 w-5 text-threadspire-gold" />
                        </div>
                        <div>
                          <h4 className="font-medium">Keep Segments Focused</h4>
                          <p className="text-sm text-muted-foreground">
                            Each segment should contain one key idea. Use multiple segments for complex thoughts.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <AlertCircle className="h-5 w-5 text-threadspire-gold" />
                        </div>
                        <div>
                          <h4 className="font-medium">Choose Tags Carefully</h4>
                          <p className="text-sm text-muted-foreground">
                            Tags help others discover your thread. Be specific but not too niche.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <AlertCircle className="h-5 w-5 text-threadspire-gold" />
                        </div>
                        <div>
                          <h4 className="font-medium">Quality Over Quantity</h4>
                          <p className="text-sm text-muted-foreground">
                            A shorter, thoughtful thread is better than a long meandering one.
                          </p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-border">
              <Button 
                variant="outline" 
                onClick={handleSaveDraft} 
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Draft'
                )}
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setShowPreview(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button 
                  onClick={() => handleSave(true)} 
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      Publish
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreadCreator;
